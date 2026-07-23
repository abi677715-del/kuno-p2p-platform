import { Module } from '@nestjs/common';
import { TradesService } from './trades.service';
import { TradesController } from './trades.controller';
import { TradeChatGateway } from './trade-chat.gateway';
import { WalletModule } from '../wallet/wallet.module';
import { AdsModule } from '../ads/ads.module';
import { KycModule } from '../kyc/kyc.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [WalletModule, AdsModule, KycModule, NotificationsModule],
  controllers: [TradesController],
  providers: [TradesService, TradeChatGateway],
})
export class TradesModule {}
