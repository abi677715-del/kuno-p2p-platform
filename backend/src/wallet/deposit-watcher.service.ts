import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma.service';
import { TxStatus, TxType } from '@prisma/client';
import { WalletService } from './wallet.service';
import { addressForNetwork } from './networks';
import { verifyDeposit } from './chain-verify';

/**
 * Polls pending deposits and checks each one against the actual blockchain
 * state, so most deposits confirm themselves without an admin manually
 * checking an explorer. Never auto-rejects — a transient RPC hiccup should
 * never kill a real deposit, so anything inconclusive just stays PENDING
 * for admin review.
 */
@Injectable()
export class DepositWatcherService {
  private readonly logger = new Logger(DepositWatcherService.name);
  private running = false;

  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async sweep() {
    if (this.running) return;
    this.running = true;
    try {
      const pending = await this.prisma.walletTransaction.findMany({
        where: { type: TxType.DEPOSIT, status: TxStatus.PENDING, network: { not: null } },
      });

      for (const record of pending) {
        if (!record.network || !record.referenceId) continue;
        const expectedAddress = addressForNetwork(record.network);
        if (!expectedAddress) continue;

        const result = await verifyDeposit(record.network, record.referenceId, expectedAddress, record.amount.toString());
        if (!result.verified) continue;

        try {
          await this.walletService.confirmDeposit(record.id);
          this.logger.log(`Auto-confirmed deposit ${record.id} on ${record.network}`);
        } catch (err: any) {
          this.logger.warn(`Failed to auto-confirm deposit ${record.id}: ${err.message}`);
        }
      }
    } finally {
      this.running = false;
    }
  }
}
