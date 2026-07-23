import { IsEnum, IsNumberString, IsString, MinLength } from 'class-validator';
import { Currency } from '@prisma/client';

export class RequestDepositDto {
  @IsEnum(Currency)
  currency: Currency;

  @IsNumberString()
  amount: string;

  @IsString()
  @MinLength(10, { message: 'Enter the transaction hash from your wallet or TronScan' })
  txHash: string;
}
