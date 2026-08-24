import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { DepositWatcherService } from './deposit-watcher.service';
import { WithdrawalSenderService } from './withdrawal-sender.service';
import { KycModule } from '../kyc/kyc.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [KycModule, AuthModule],
  controllers: [WalletController],
  providers: [WalletService, DepositWatcherService, WithdrawalSenderService],
  exports: [WalletService],
})
export class WalletModule {}
