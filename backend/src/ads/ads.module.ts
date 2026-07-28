import { Module } from '@nestjs/common';
import { AdsService } from './ads.service';
import { AdsController } from './ads.controller';
import { AdAutoPauseService } from './ad-auto-pause.service';
import { KycModule } from '../kyc/kyc.module';

@Module({
  imports: [KycModule],
  controllers: [AdsController],
  providers: [AdsService, AdAutoPauseService],
  exports: [AdsService],
})
export class AdsModule {}
