import { Module } from '@nestjs/common';
import { KycModule } from '../kyc/kyc.module';
import { TransfersService } from './transfers.service';
import { TransfersController } from './transfers.controller';

@Module({
  imports: [KycModule],
  controllers: [TransfersController],
  providers: [TransfersService],
})
export class TransfersModule {}
