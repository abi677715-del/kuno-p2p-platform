import { Module } from '@nestjs/common';
import { AdsService } from './ads.service';
import { AdsController } from './ads.controller';
import { AdAutoPauseService } from './ad-auto-pause.service';
import { KycModule } from '../kyc/kyc.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [KycModule, UsersModule],
  controllers: [AdsController],
  providers: [AdsService, AdAutoPauseService],
  exports: [AdsService],
})
export class AdsModule {}
