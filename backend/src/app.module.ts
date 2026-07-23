import { Module } from '@nestjs/common';
import { PrismaModule } from './common/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { WalletModule } from './wallet/wallet.module';
import { AdsModule } from './ads/ads.module';
import { TradesModule } from './trades/trades.module';
import { KycModule } from './kyc/kyc.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    WalletModule,
    AdsModule,
    TradesModule,
    KycModule,
    NotificationsModule,
  ],
})
export class AppModule {}
