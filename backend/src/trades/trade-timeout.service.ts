import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { TradesService } from './trades.service';

const SWEEP_INTERVAL_MS = 60_000;
const TIMEOUT_MINUTES = 15;

/**
 * Polls for trades stuck past the 15-minute window and resolves them —
 * unpaid escrow gets cancelled, but a paid-and-unconfirmed trade is
 * escalated to a dispute rather than cancelled (see trades.service.ts for
 * why auto-cancelling a paid trade would be unsafe for the buyer).
 */
@Injectable()
export class TradeTimeoutService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TradeTimeoutService.name);
  private interval: NodeJS.Timeout | null = null;

  constructor(private tradesService: TradesService) {}

  onModuleInit() {
    this.interval = setInterval(() => this.sweep(), SWEEP_INTERVAL_MS);
  }

  onModuleDestroy() {
    if (this.interval) clearInterval(this.interval);
  }

  private async sweep() {
    try {
      await this.tradesService.autoCancelStaleEscrow(TIMEOUT_MINUTES);
      await this.tradesService.autoEscalateUnconfirmedPayments(TIMEOUT_MINUTES);
    } catch (err) {
      this.logger.error('Trade timeout sweep failed', err as Error);
    }
  }
}
