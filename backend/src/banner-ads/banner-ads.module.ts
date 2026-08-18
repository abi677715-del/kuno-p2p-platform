import { Module } from '@nestjs/common';
import { BannerAdsService } from './banner-ads.service';
import { BannerAdsController } from './banner-ads.controller';

@Module({
  controllers: [BannerAdsController],
  providers: [BannerAdsService],
})
export class BannerAdsModule {}
