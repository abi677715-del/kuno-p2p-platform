import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { TradesService } from './trades.service';
import { TRADE_TIMEOUT_MINUTES } from './trade-timeout.constants';

const SWEEP_INTERVAL_MS = 60_000;
const TIMEOUT_MINUTES = TRADE_TIMEOUT_MINUTES;
const WARN_BEFORE_MINUTES = 5;

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
      await this.tradesService.warnApproachingTimeouts(TIMEOUT_MINUTES, WARN_BEFORE_MINUTES);
      await this.tradesService.autoCancelStaleEscrow(TIMEOUT_MINUTES);
      await this.tradesService.autoEscalateUnconfirmedPayments(TIMEOUT_MINUTES);
    } catch (err) {
      this.logger.error('Trade timeout sweep failed', err as Error);
    }
  }
}
