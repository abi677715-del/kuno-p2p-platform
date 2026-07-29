import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { DepositWatcherService } from './deposit-watcher.service';

@Module({
  controllers: [WalletController],
  providers: [WalletService, DepositWatcherService],
  exports: [WalletService],
})
export class WalletModule {}
