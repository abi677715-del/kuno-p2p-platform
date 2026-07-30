import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { authenticator } from 'otplib';
import { PrismaService } from '../common/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { AdsService } from '../ads/ads.service';
import { KycService } from '../kyc/kyc.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RelationsService } from '../relations/relations.service';
import { AdSide, Currency, DisputeStatus, EscrowStatus, TradeStatus } from '@prisma/client';
import { CreateTradeDto } from './dto/create-trade.dto';
import { DisputeTradeDto } from './dto/dispute-trade.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { ResolveDisputeDto, DisputeOutcome } from './dto/resolve-dispute.dto';

const REFERRAL_FEE_SHARE_PERCENT = parseFloat(process.env.REFERRAL_FEE_SHARE_PERCENT ?? '20');

@Injectable()
export class TradesService {
  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
    private adsService: AdsService,
    private kycService: KycService,
    private notificationsService: NotificationsService,
    private relationsService: RelationsService,
  ) {}

  /**
   * Starts a trade against an ad. Whoever holds the USDT (the "seller" role)
   * has it locked into escrow immediately — that's what makes the trade safe
   * to start before any fiat has moved.
   */
  async createTrade(takerId: string, dto: CreateTradeDto) {
    await this.kycService.assertApproved(takerId);
    const ad = await this.adsService.findById(dto.adId);
    await this.kycService.assertApproved(ad.userId);

    // If the ad owner is selling USDT, they are the seller and the taker buys.
    // If the ad owner is buying USDT, the taker is the one selling USDT.
    const sellerId = ad.side === AdSide.SELL ? ad.userId : takerId;
    const buyerId = ad.side === AdSide.SELL ? takerId : ad.userId;

    if (sellerId === buyerId) {
      throw new BadRequestException('You cannot trade against your own ad');
    }

    if (await this.relationsService.isBlocked(sellerId, buyerId)) {
      throw new BadRequestException('You cannot trade with this user');
    }

    const amountUsdt = dto.amountUsdt;
    const amountEtb = (parseFloat(amountUsdt) * parseFloat(ad.effectivePriceEtb)).toFixed(4);

    const amountEtbNum = parseFloat(amountEtb);
    const minLimit = parseFloat(ad.minLimitEtb.toString());
    const maxLimit = parseFloat(ad.maxLimitEtb.toString());
    if (amountEtbNum < minLimit || amountEtbNum > maxLimit) {
      throw new BadRequestException(
        `This ad only accepts trades between ${minLimit} and ${maxLimit} ETB — your amount comes to ${amountEtbNum} ETB.`,
      );
    }

    const trade = await this.prisma.trade.create({
      data: {
        adId: ad.id,
        buyerId,
        sellerId,
        amountUsdt,
        amountEtb,
        status: TradeStatus.PENDING,
      },
    });

    // Lock the seller's USDT into escrow. If this fails (insufficient balance),
    // the trade row stays PENDING and the caller sees the error.
    await this.walletService.lockFunds(sellerId, Currency.USDT, amountUsdt, trade.id);
    await this.prisma.escrow.create({
      data: { tradeId: trade.id, amount: amountUsdt, status: EscrowStatus.LOCKED },
    });

    return this.prisma.trade.update({
      where: { id: trade.id },
      data: { status: TradeStatus.ESCROW_LOCKED },
    }).then(async (updated) => {
      await this.notificationsService.create(
        buyerId,
        'TRADE_ESCROW_LOCKED',
        { tradeId: updated.id, message: 'Escrow is locked — you can send payment now.' },
        { subject: 'Escrow locked — send payment now', message: 'Escrow is locked — you can send payment now.', tradeId: updated.id },
      );
      return updated;
    });
  }

  listMine(userId: string) {
    return this.prisma.trade.findMany({
      where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
      include: {
        buyer: { select: { id: true, email: true, fullName: true } },
        seller: { select: { id: true, email: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const trade = await this.prisma.trade.findUnique({
      where: { id },
      include: { escrow: true, ad: true },
    });
    if (!trade) throw new NotFoundException('Trade not found');
    return trade;
  }

  /** Trade lookup for display — also includes the fee percent that'll apply on release. */
  async getOne(id: string) {
    const trade = await this.findById(id);
    const feePercent = await this.resolveFeePercent(trade);
    return { ...trade, feePercent };
  }

  /**
   * The ad's poster is the "merchant" side of the trade — if an admin has
   * flagged them as a merchant, the whole trade gets the discounted fee.
   */
  private async resolveFeePercent(trade: { ad: { userId: string } }): Promise<number> {
    const maker = await this.prisma.user.findUnique({
      where: { id: trade.ad.userId },
      select: { isMerchant: true },
    });
    return this.walletService.getFeePercent(!!maker?.isMerchant);
  }

  private assertParticipant(trade: { buyerId: string; sellerId: string }, userId: string) {
    if (trade.buyerId !== userId && trade.sellerId !== userId) {
      throw new ForbiddenException('You are not part of this trade');
    }
  }

  /** Buyer marks the trade as paid once they've sent the ETB. */
  async markPaid(userId: string, tradeId: string) {
    const trade = await this.findById(tradeId);
    if (trade.buyerId !== userId) throw new ForbiddenException('Only the buyer can mark a trade as paid');
    if (trade.status !== TradeStatus.ESCROW_LOCKED) {
      throw new BadRequestException(`Cannot mark paid from status ${trade.status}`);
    }
    const updated = await this.prisma.trade.update({
      where: { id: tradeId },
      data: { status: TradeStatus.PAID, paidAt: new Date() },
    });
    const message = 'The buyer marked this trade as paid — please confirm once you\u2019ve received it.';
    await this.notificationsService.create(
      trade.sellerId,
      'TRADE_MARKED_PAID',
      { tradeId, message },
      { subject: 'Buyer marked payment sent', message, tradeId },
    );
    return updated;
  }

  /**
   * Seller confirms receipt of ETB — this releases escrowed USDT to the
   * buyer. If the seller has 2FA enabled, a valid authenticator code is
   * required — releasing escrow is irreversible, so it gets the same
   * confirmation step as a login.
   */
  async confirmPayment(userId: string, tradeId: string, dto?: ConfirmPaymentDto) {
    const trade = await this.findById(tradeId);
    if (trade.sellerId !== userId) throw new ForbiddenException('Only the seller can confirm payment');
    if (trade.status !== TradeStatus.PAID) {
      throw new BadRequestException(`Cannot confirm from status ${trade.status}`);
    }

    const seller = await this.prisma.user.findUnique({ where: { id: userId } });
    if (seller?.twoFaEnabled) {
      if (!dto?.code || !seller.twoFaSecret || !authenticator.verify({ token: dto.code, secret: seller.twoFaSecret })) {
        throw new BadRequestException('Enter a valid code from your authenticator app to release the funds');
      }
    }

        await this.kycService.assertApproved(trade.buyerId);

    const feePercent = await this.resolveFeePercent(trade);
    const releaseResult = await this.walletService.releaseFunds(
      trade.sellerId,
      trade.buyerId,
      Currency.USDT,
      trade.amountUsdt.toString(),
      trade.id,
      feePercent,
    );
    await this.prisma.escrow.update({
      where: { tradeId },
      data: { status: EscrowStatus.RELEASED, releasedAt: new Date() },
    });

    const updated = await this.prisma.trade.update({
      where: { id: tradeId },
      data: { status: TradeStatus.COMPLETED, completedAt: new Date() },
    });
    const message = `Trade complete — ${releaseResult.netAmount} USDT released to your wallet (${releaseResult.feeAmount} USDT platform fee).`;
    await this.notificationsService.create(
      trade.buyerId,
      'TRADE_COMPLETED',
      { tradeId, message },
      { subject: 'Trade complete', message, tradeId },
    );
    await this.creditReferralBonuses(trade, releaseResult.feeAmount);
    return updated;
  }

  /** Marks the trade's chat as read up to now, for whichever side the caller is on. */
  async markRead(userId: string, tradeId: string) {
    const trade = await this.findById(tradeId);
    this.assertParticipant(trade, userId);
    const field = trade.buyerId === userId ? 'buyerLastReadAt' : 'sellerLastReadAt';
    await this.prisma.trade.update({ where: { id: tradeId }, data: { [field]: new Date() } });
    return { ok: true };
  }

  /**
   * Pays out a cut of the platform fee to whichever party's referrer(s)
   * exist — both the buyer's and seller's referrers can earn on the same
   * trade, since each is being rewarded for bringing in a different trader.
   */
  private async creditReferralBonuses(trade: { id: string; buyerId: string; sellerId: string }, feeAmount: string) {
    if (REFERRAL_FEE_SHARE_PERCENT <= 0) return;
    const bonus = ((parseFloat(feeAmount) * REFERRAL_FEE_SHARE_PERCENT) / 100).toFixed(8);
    if (parseFloat(bonus) <= 0) return;

    const [buyer, seller] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: trade.buyerId }, select: { referredById: true } }),
      this.prisma.user.findUnique({ where: { id: trade.sellerId }, select: { referredById: true } }),
    ]);
    const referrerIds = [...new Set([buyer?.referredById, seller?.referredById].filter((id): id is string => !!id))];

    await Promise.all(
      referrerIds.map((referrerId) =>
        this.walletService.creditReferralBonus(referrerId, Currency.USDT, bonus, trade.id).catch(() => {}),
      ),
    );
  }

  /** Cancels a trade before payment is claimed, refunding escrow to the seller. */
  async cancelTrade(userId: string, tradeId: string) {
    const trade = await this.findById(tradeId);
    this.assertParticipant(trade, userId);
    if (![TradeStatus.PENDING, TradeStatus.ESCROW_LOCKED].includes(trade.status as any)) {
      throw new BadRequestException('Trade can no longer be cancelled — payment has already been marked');
    }

    if (trade.escrow) {
      await this.walletService.refundFunds(trade.sellerId, Currency.USDT, trade.amountUsdt.toString(), trade.id);
      await this.prisma.escrow.update({ where: { tradeId }, data: { status: EscrowStatus.REFUNDED } });
    }

    const updated = await this.prisma.trade.update({ where: { id: tradeId }, data: { status: TradeStatus.CANCELLED } });
    const counterparty = userId === trade.buyerId ? trade.sellerId : trade.buyerId;
    const message = 'This trade was cancelled.';
    await this.notificationsService.create(
      counterparty,
      'TRADE_CANCELLED',
      { tradeId, message },
      { subject: 'Trade cancelled', message, tradeId },
    );
    return updated;
  }

  /** Either party can raise a dispute once payment has been claimed but the other side disagrees. */
  async raiseDispute(userId: string, tradeId: string, dto: DisputeTradeDto) {
    const trade = await this.findById(tradeId);
    this.assertParticipant(trade, userId);
    if (trade.status === TradeStatus.COMPLETED || trade.status === TradeStatus.CANCELLED) {
      throw new BadRequestException('Cannot dispute a finished trade');
    }

    await this.prisma.dispute.create({
      data: { tradeId, raisedById: userId, reason: dto.reason, status: DisputeStatus.OPEN },
    });

    const updated = await this.prisma.trade.update({ where: { id: tradeId }, data: { status: TradeStatus.DISPUTED } });

    const counterparty = userId === trade.buyerId ? trade.sellerId : trade.buyerId;
    const message = 'A dispute was opened on this trade — our support team will review the chat log and evidence.';
    await this.notificationsService.create(
      counterparty,
      'DISPUTE_OPENED',
      { tradeId, message },
      { subject: 'Dispute opened on your trade', message, tradeId },
    );

    return updated;
  }

  // --- Timeouts (called by TradeTimeoutService on a schedule) ---

  /**
   * Escrow that's been locked for too long with no payment claimed ties up
   * the seller's funds indefinitely — cancel it and refund the seller.
   * Safe to auto-cancel here because no fiat has changed hands yet.
   */
  async autoCancelStaleEscrow(olderThanMinutes: number) {
    const cutoff = new Date(Date.now() - olderThanMinutes * 60_000);
    const stale = await this.prisma.trade.findMany({
      where: { status: TradeStatus.ESCROW_LOCKED, createdAt: { lt: cutoff } },
      include: { escrow: true },
    });

    for (const trade of stale) {
      if (trade.escrow) {
        await this.walletService.refundFunds(trade.sellerId, Currency.USDT, trade.amountUsdt.toString(), trade.id);
        await this.prisma.escrow.update({ where: { tradeId: trade.id }, data: { status: EscrowStatus.REFUNDED } });
      }
      await this.prisma.trade.update({ where: { id: trade.id }, data: { status: TradeStatus.CANCELLED } });
      const message = `This trade was automatically cancelled — no payment was marked within ${olderThanMinutes} minutes.`;
      await Promise.all([
        this.notificationsService.create(trade.buyerId, 'TRADE_CANCELLED', { tradeId: trade.id, message }, { subject: 'Trade cancelled', message, tradeId: trade.id }),
        this.notificationsService.create(trade.sellerId, 'TRADE_CANCELLED', { tradeId: trade.id, message }, { subject: 'Trade cancelled', message, tradeId: trade.id }),
      ]);
    }
    return stale.length;
  }

  /**
   * A buyer who already sent fiat and is waiting on the seller to confirm
   * must never be auto-cancelled — that would let the seller keep both the
   * fiat and the escrowed USDT. Escalate to a dispute instead, so an admin
   * reviews the chat log and decides fairly.
   */
  async autoEscalateUnconfirmedPayments(olderThanMinutes: number) {
    const cutoff = new Date(Date.now() - olderThanMinutes * 60_000);
    const stale = await this.prisma.trade.findMany({
      where: { status: TradeStatus.PAID, paidAt: { lt: cutoff } },
    });

    for (const trade of stale) {
      await this.prisma.dispute.create({
        data: {
          tradeId: trade.id,
          raisedById: trade.buyerId,
          reason: `Auto-escalated: seller did not confirm payment within ${olderThanMinutes} minutes of the buyer marking it paid.`,
          status: DisputeStatus.OPEN,
        },
      });
      await this.prisma.trade.update({ where: { id: trade.id }, data: { status: TradeStatus.DISPUTED } });
      const message = 'The seller didn’t confirm your payment in time — this trade has been escalated to support for review.';
      await Promise.all([
        this.notificationsService.create(trade.buyerId, 'DISPUTE_OPENED', { tradeId: trade.id, message }, { subject: 'Trade escalated to support', message, tradeId: trade.id }),
        this.notificationsService.create(trade.sellerId, 'DISPUTE_OPENED', { tradeId: trade.id, message }, { subject: 'Trade escalated to support', message, tradeId: trade.id }),
      ]);
    }
    return stale.length;
  }

  async sendMessage(userId: string, tradeId: string, dto: SendMessageDto) {
    const trade = await this.findById(tradeId);
    this.assertParticipant(trade, userId);
    if (!dto.message?.trim() && !dto.attachmentUrl) {
      throw new BadRequestException('Message must include text or an attachment');
    }
    if (dto.attachmentUrl && dto.attachmentUrl.length > 700_000) {
      throw new BadRequestException('Attachment is too large');
    }
    return this.prisma.tradeMessage.create({
      data: { tradeId, senderId: userId, message: dto.message ?? '', attachmentUrl: dto.attachmentUrl },
    });
  }

  async getMessages(userId: string, tradeId: string) {
    const trade = await this.findById(tradeId);
    this.assertParticipant(trade, userId);
    return this.prisma.tradeMessage.findMany({ where: { tradeId }, orderBy: { createdAt: 'asc' } });
  }

  // --- Admin: dispute resolution ---

  /** Lets an admin read a trade's full chat log while reviewing a dispute, without being a participant. */
  getMessagesForAdmin(tradeId: string) {
    return this.prisma.tradeMessage.findMany({
      where: { tradeId },
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: { email: true } } },
    });
  }

  listOpenDisputes() {
    return this.prisma.dispute.findMany({
      where: { status: DisputeStatus.OPEN },
      include: {
        trade: { include: { buyer: { select: { email: true } }, seller: { select: { email: true } } } },
        raisedBy: { select: { email: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * An admin decides the outcome after reviewing the trade chat and any
   * evidence: either release the escrowed USDT to the buyer (payment did
   * happen) or refund it to the seller (it didn't).
   */
  async resolveDispute(adminId: string, disputeId: string, dto: ResolveDisputeDto) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { trade: { include: { ad: true } } },
    });
    if (!dispute) throw new NotFoundException('Dispute not found');
    if (dispute.status !== DisputeStatus.OPEN) throw new BadRequestException('Dispute already resolved');

    const { trade } = dispute;

    if (dto.outcome === DisputeOutcome.RELEASE_TO_BUYER) {
      const feePercent = await this.resolveFeePercent(trade);
      const releaseResult = await this.walletService.releaseFunds(
        trade.sellerId,
        trade.buyerId,
        Currency.USDT,
        trade.amountUsdt.toString(),
        trade.id,
        feePercent,
      );
      await this.prisma.escrow.update({ where: { tradeId: trade.id }, data: { status: EscrowStatus.RELEASED, releasedAt: new Date() } });
      await this.prisma.trade.update({
        where: { id: trade.id },
        data: { status: TradeStatus.COMPLETED, completedAt: new Date() },
      });
      await this.creditReferralBonuses(trade, releaseResult.feeAmount);
    } else {
      await this.walletService.refundFunds(trade.sellerId, Currency.USDT, trade.amountUsdt.toString(), trade.id);
      await this.prisma.escrow.update({ where: { tradeId: trade.id }, data: { status: EscrowStatus.REFUNDED } });
      await this.prisma.trade.update({ where: { id: trade.id }, data: { status: TradeStatus.CANCELLED } });
    }

    const updatedDispute = await this.prisma.dispute.update({
      where: { id: disputeId },
      data: { status: DisputeStatus.RESOLVED, resolvedBy: adminId, resolution: dto.resolution },
    });

    await this.prisma.adminAuditLog.create({
      data: { adminId, action: `DISPUTE_RESOLVED: ${dto.outcome} — ${dto.resolution}`, targetId: trade.id },
    });

    const resolutionMessage =
      dto.outcome === DisputeOutcome.RELEASE_TO_BUYER
        ? 'The dispute was resolved: escrow was released to the buyer.'
        : 'The dispute was resolved: escrow was refunded to the seller.';
    await Promise.all([
      this.notificationsService.create(
        trade.buyerId,
        'DISPUTE_RESOLVED',
        { tradeId: trade.id, outcome: dto.outcome },
        { subject: 'Dispute resolved', message: resolutionMessage, tradeId: trade.id },
      ),
      this.notificationsService.create(
        trade.sellerId,
        'DISPUTE_RESOLVED',
        { tradeId: trade.id, outcome: dto.outcome },
        { subject: 'Dispute resolved', message: resolutionMessage, tradeId: trade.id },
      ),
    ]);

    return updatedDispute;
  }
}
