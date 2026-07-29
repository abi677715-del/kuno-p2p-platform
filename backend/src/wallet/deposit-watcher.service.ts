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
 *
 * Everyone deposits to the same custodial address per network, so a claimed
 * txHash alone doesn't prove the deposit belongs to the claiming user —
 * someone could spot a real incoming transfer on a public explorer and
 * claim it as their own before the real sender submits it. To limit that:
 * a user's very first deposit on a network always goes to manual review,
 * and later deposits only auto-confirm if the on-chain sending address
 * matches one already tied to a deposit of theirs that was confirmed
 * before (manually or automatically). A deposit from an unrecognized
 * sending address also falls back to manual review instead of auto-rejecting.
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
        include: { wallet: true },
      });

      for (const record of pending) {
        if (!record.network || !record.referenceId) continue;
        const expectedAddress = addressForNetwork(record.network);
        if (!expectedAddress) continue;

        const result = await verifyDeposit(record.network, record.referenceId, expectedAddress, record.amount.toString());
        if (!result.verified) continue;

        if (result.fromAddress && result.fromAddress !== record.fromAddress) {
          await this.prisma.walletTransaction.update({
            where: { id: record.id },
            data: { fromAddress: result.fromAddress },
          });
        }

        const priorConfirmed = await this.prisma.walletTransaction.findMany({
          where: {
            type: TxType.DEPOSIT,
            status: TxStatus.CONFIRMED,
            network: record.network,
            wallet: { userId: record.wallet.userId },
            fromAddress: { not: null },
          },
          select: { fromAddress: true },
        });

        const isFirstDeposit = priorConfirmed.length === 0;
        const fromKnown = !!result.fromAddress && priorConfirmed.some((r) => r.fromAddress === result.fromAddress);

        if (isFirstDeposit || !fromKnown) {
          this.logger.log(
            `Deposit ${record.id} on ${record.network} verified on-chain but left for manual review ` +
              `(${isFirstDeposit ? 'first deposit on this network' : 'sending address not seen before'})`,
          );
          continue;
        }

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
