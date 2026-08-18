import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './common/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { WalletModule } from './wallet/wallet.module';
import { AdsModule } from './ads/ads.module';
import { TradesModule } from './trades/trades.module';
import { KycModule } from './kyc/kyc.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SupportModule } from './support/support.module';
import { AuditModule } from './audit/audit.module';
import { RelationsModule } from './relations/relations.module';
import { AdminModule } from './admin/admin.module';
import { MerchantModule } from './merchant/merchant.module';
import { AppealsModule } from './appeals/appeals.module';
import { TransfersModule } from './transfers/transfers.module';
import { BannerAdsModule } from './banner-ads/banner-ads.module';
import { AppController } from './app.controller';

@Module({
  controllers: [AppController],
  imports: [
    // Generous global default — signup/login apply a much stricter limit
    // themselves via @Throttle(), see auth.controller.ts.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    WalletModule,
    AdsModule,
    TradesModule,
    KycModule,
    NotificationsModule,
    SupportModule,
    AuditModule,
    RelationsModule,
    AdminModule,
    MerchantModule,
    AppealsModule,
    TransfersModule,
    BannerAdsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
