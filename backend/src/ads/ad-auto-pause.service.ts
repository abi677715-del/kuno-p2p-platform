import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { AdsService } from './ads.service';

const SWEEP_INTERVAL_MS = 5 * 60_000;
const OFFLINE_MINUTES = 120;

/**
 * Polls for ads left ACTIVE while their poster has been offline for a while
 * and pauses them — see AdsService.autoPauseStaleAds for why.
 */
@Injectable()
export class AdAutoPauseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AdAutoPauseService.name);
  private interval: NodeJS.Timeout | null = null;

  constructor(private adsService: AdsService) {}

  onModuleInit() {
    this.interval = setInterval(() => this.sweep(), SWEEP_INTERVAL_MS);
  }

  onModuleDestroy() {
    if (this.interval) clearInterval(this.interval);
  }

  private async sweep() {
    try {
      await this.adsService.autoPauseStaleAds(OFFLINE_MINUTES);
    } catch (err) {
      this.logger.error('Ad auto-pause sweep failed', err as Error);
    }
  }
}
