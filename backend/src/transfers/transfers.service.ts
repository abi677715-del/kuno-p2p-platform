import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { Currency, TxStatus, TxType } from '@prisma/client';
import { parseBid, formatBid } from '../common/bid';
import { generateTxCode } from '../wallet/tx-code';
import { KycService } from '../kyc/kyc.service';
import { CreateTransferDto } from './dto/create-transfer.dto';

@Injectable()
export class TransfersService {
  constructor(
    private prisma: PrismaService,
    private kycService: KycService,
  ) {}

  /** Looks up a trader by their public BID code, for the frontend to confirm "sending to <name>" before submitting. */
  async resolveRecipient(bid: string) {
    const bidNumber = parseBid(bid ?? '');
    if (bidNumber === null) return null;
    return this.prisma.user.findUnique({
      where: { bidNumber },
      select: { id: true, fullName: true, isMerchant: true },
    });
  }

  /**
   * Direct wallet-to-wallet transfer, no fee, no ad or trade involved. The
   * recipient is resolved from their public trader ID so senders never see
   * or need another user's email. Runs as one transaction so a failure
   * partway through can't leave money debited without being credited.
   */
  async send(fromUserId: string, dto: CreateTransferDto) {
    await this.kycService.assertApproved(fromUserId);

    if (!(parseFloat(dto.amount) > 0)) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    const bidNumber = parseBid(dto.recipientBid);
    if (bidNumber === null) throw new BadRequestException('Enter a valid trader ID (e.g. BID7K3F9A)');

    const toUser = await this.prisma.user.findUnique({ where: { bidNumber } });
    if (!toUser) throw new NotFoundException('No trader found with that ID');
    if (toUser.id === fromUserId) throw new BadRequestException("You can't transfer to yourself");

    return this.prisma.$transaction(async (tx) => {
      const fromWallet = await tx.wallet.findUnique({
        where: { userId_currency: { userId: fromUserId, currency: Currency.USDT } },
      });
      const toWallet = await tx.wallet.findUnique({
        where: { userId_currency: { userId: toUser.id, currency: Currency.USDT } },
      });
      if (!fromWallet || !toWallet) throw new NotFoundException('Wallet not found');

      const updated = await tx.wallet.updateMany({
        where: { id: fromWallet.id, balance: { gte: dto.amount } },
        data: { balance: { decrement: dto.amount } },
      });
      if (updated.count === 0) throw new BadRequestException('Insufficient available balance');

      await tx.wallet.update({ where: { id: toWallet.id }, data: { balance: { increment: dto.amount } } });

      const transfer = await tx.internalTransfer.create({
        data: { fromUserId, toUserId: toUser.id, currency: Currency.USDT, amount: dto.amount, note: dto.note },
      });

      await tx.walletTransaction.createMany({
        data: [
          {
            walletId: fromWallet.id,
            type: TxType.TRANSFER_SENT,
            amount: dto.amount,
            referenceId: transfer.id,
            status: TxStatus.CONFIRMED,
            code: generateTxCode(),
          },
          {
            walletId: toWallet.id,
            type: TxType.TRANSFER_RECEIVED,
            amount: dto.amount,
            referenceId: transfer.id,
            status: TxStatus.CONFIRMED,
            code: generateTxCode(),
          },
        ],
      });

      return transfer;
    });
  }

  async listMine(userId: string) {
    const transfers = await this.prisma.internalTransfer.findMany({
      where: { OR: [{ fromUserId: userId }, { toUserId: userId }] },
      include: {
        fromUser: { select: { id: true, fullName: true, bidNumber: true } },
        toUser: { select: { id: true, fullName: true, bidNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return transfers.map((t) => ({
      ...t,
      fromUser: { ...t.fromUser, bid: formatBid(t.fromUser.bidNumber) },
      toUser: { ...t.toUser, bid: formatBid(t.toUser.bidNumber) },
    }));
  }
}
