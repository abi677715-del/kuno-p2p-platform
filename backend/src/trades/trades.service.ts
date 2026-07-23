import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { AdsService } from '../ads/ads.service';
import { KycService } from '../kyc/kyc.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AdSide, Currency, DisputeStatus, EscrowStatus, TradeStatus } from '@prisma/client';
import { CreateTradeDto } from './dto/create-trade.dto';
import { DisputeTradeDto } from './dto/dispute-trade.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ResolveDisputeDto, DisputeOutcome } from './dto/resolve-dispute.dto';

@Injectable()
export class TradesService {
  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
    private adsService: AdsService,
    private kycService: KycService,
    private notificationsService: NotificationsService,
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

    const amountUsdt = dto.amountUsdt;
    const amountEtb = (parseFloat(amountUsdt) * parseFloat(ad.priceEtb.toString())).toFixed(4);

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
      await this.notificationsService.create(buyerId, 'TRADE_ESCROW_LOCKED', {
        tradeId: updated.id,
        message: 'Escrow is locked — you can send payment now.',
      });
      return updated;
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
    const updated = await this.prisma.trade.update({ where: { id: tradeId }, data: { status: TradeStatus.PAID } });
    await this.notificationsService.create(trade.sellerId, 'TRADE_MARKED_PAID', {
      tradeId,
      message: 'The buyer marked this trade as paid — please confirm once you\u2019ve received it.',
    });
    return updated;
  }

  /** Seller confirms receipt of ETB — this releases escrowed USDT to the buyer. */
  async confirmPayment(userId: string, tradeId: string) {
    const trade = await this.findById(tradeId);
    if (trade.sellerId !== userId) throw new ForbiddenException('Only the seller can confirm payment');
    if (trade.status !== TradeStatus.PAID) {
      throw new BadRequestException(`Cannot confirm from status ${trade.status}`);
    }

    const releaseResult = await this.walletService.releaseFunds(
      trade.sellerId,
      trade.buyerId,
      Currency.USDT,
      trade.amountUsdt.toString(),
      trade.id,
    );
    await this.prisma.escrow.update({
      where: { tradeId },
      data: { status: EscrowStatus.RELEASED, releasedAt: new Date() },
    });

    const updated = await this.prisma.trade.update({ where: { id: tradeId }, data: { status: TradeStatus.COMPLETED } });
    await this.notificationsService.create(trade.buyerId, 'TRADE_COMPLETED', {
      tradeId,
      message: `Trade complete — ${releaseResult.netAmount} USDT released to your wallet (${releaseResult.feeAmount} USDT platform fee).`,
    });
    return updated;
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
    await this.notificationsService.create(counterparty, 'TRADE_CANCELLED', {
      tradeId,
      message: 'This trade was cancelled.',
    });
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

    return this.prisma.trade.update({ where: { id: tradeId }, data: { status: TradeStatus.DISPUTED } });
  }

  async sendMessage(userId: string, tradeId: string, dto: SendMessageDto) {
    const trade = await this.findById(tradeId);
    this.assertParticipant(trade, userId);
    return this.prisma.tradeMessage.create({
      data: { tradeId, senderId: userId, message: dto.message, attachmentUrl: dto.attachmentUrl },
    });
  }

  async getMessages(userId: string, tradeId: string) {
    const trade = await this.findById(tradeId);
    this.assertParticipant(trade, userId);
    return this.prisma.tradeMessage.findMany({ where: { tradeId }, orderBy: { createdAt: 'asc' } });
  }

  // --- Admin: dispute resolution ---

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
    const dispute = await this.prisma.dispute.findUnique({ where: { id: disputeId }, include: { trade: true } });
    if (!dispute) throw new NotFoundException('Dispute not found');
    if (dispute.status !== DisputeStatus.OPEN) throw new BadRequestException('Dispute already resolved');

    const { trade } = dispute;

    if (dto.outcome === DisputeOutcome.RELEASE_TO_BUYER) {
      await this.walletService.releaseFunds(
        trade.sellerId,
        trade.buyerId,
        Currency.USDT,
        trade.amountUsdt.toString(),
        trade.id,
      );
      await this.prisma.escrow.update({ where: { tradeId: trade.id }, data: { status: EscrowStatus.RELEASED, releasedAt: new Date() } });
      await this.prisma.trade.update({ where: { id: trade.id }, data: { status: TradeStatus.COMPLETED } });
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

    await Promise.all([
      this.notificationsService.create(trade.buyerId, 'DISPUTE_RESOLVED', { tradeId: trade.id, outcome: dto.outcome }),
      this.notificationsService.create(trade.sellerId, 'DISPUTE_RESOLVED', { tradeId: trade.id, outcome: dto.outcome }),
    ]);

    return updatedDispute;
  }
}
