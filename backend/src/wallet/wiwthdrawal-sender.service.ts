import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma.service';
import { TxStatus, TxType } from '@prisma/client';
import { WalletService } from './wallet.service';
import { sendUsdt, signerConfigured } from './chain-send';
import { AUTO_WITHDRAWAL_MAX_USDT, gasFeeUsdt } from './withdrawal-fees';

/**
 * Auto-sends small withdrawals on-chain once a hot wallet is configured for
 * that network. Withdrawals above AUTO_WITHDRAWAL_MAX_USDT, or on networks
 * with no signer key set, are left PENDING for an admin to send by hand —
 * same as today. Never marks a withdrawal FAILED on its own; a broadcast
 * error just leaves it PENDING to retry next minute or be handled manually.
 */
@Injectable()
export class WithdrawalSenderService {
  private readonly logger = new Logger(WithdrawalSenderService.name);
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
        where: { type: TxType.WITHDRAWAL, status: TxStatus.PENDING, network: { not: null } },
      });

      for (const record of pending) {
        if (!record.network || !record.referenceId) continue;
        if (!signerConfigured(record.network)) continue;

        const amount = parseFloat(record.amount.toString());
        if (amount > AUTO_WITHDRAWAL_MAX_USDT) continue;

        const fee = gasFeeUsdt(record.network);
        const sendAmount = amount - fee;
        if (sendAmount <= 0) continue;

        // Atomically claim this withdrawal before broadcasting anything on-chain.
        // If another instance of this service (e.g. a second Railway replica)
        // already claimed it, `count` comes back 0 and we skip it — this is
        // what actually prevents the same withdrawal from being sent twice,
        // not just the in-process `running` flag above.
        const claimed = await this.prisma.walletTransaction.updateMany({
          where: { id: record.id, status: TxStatus.PENDING },
          data: { status: TxStatus.PROCESSING },
        });
        if (claimed.count === 0) continue;

        try {
          const { txHash } = await sendUsdt(record.network, record.referenceId, sendAmount.toFixed(6));
          await this.walletService.completeAutoWithdrawal(record.id, txHash, fee.toFixed(8));
          this.logger.log(`Auto-sent withdrawal ${record.id} on ${record.network}: ${txHash}`);
        } catch (err: any) {
          this.logger.warn(`Failed to auto-send withdrawal ${record.id}: ${err.message}`);
          await this.prisma.walletTransaction.updateMany({
            where: { id: record.id, status: TxStatus.PROCESSING },
            data: { status: TxStatus.PENDING },
          });
        }
      }
    } finally {
      this.running = false;
    }
  }
}
