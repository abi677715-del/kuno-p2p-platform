import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TradesService } from './trades.service';
import { TradesController } from './trades.controller';
import { TradeChatGateway } from './trade-chat.gateway';
import { TradeTimeoutService } from './trade-timeout.service';
import { WalletModule } from '../wallet/wallet.module';
import { AdsModule } from '../ads/ads.module';
import { KycModule } from '../kyc/kyc.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RelationsModule } from '../relations/relations.module';

@Module({
  imports: [WalletModule, AdsModule, KycModule, NotificationsModule, RelationsModule, JwtModule.register({})],
  controllers: [TradesController],
  providers: [TradesService, TradeChatGateway, TradeTimeoutService],
})
export class TradesModule {}
