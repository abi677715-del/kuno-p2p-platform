import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { DepositWatcherService } from './deposit-watcher.service';
import { WithdrawalSenderService } from './withdrawal-sender.service';

@Module({
  controllers: [WalletController],
  providers: [WalletService, DepositWatcherService, WithdrawalSenderService],
  exports: [WalletService],
})
export class WalletModule {}
