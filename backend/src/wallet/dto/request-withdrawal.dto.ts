import { IsEnum, IsNumberString, IsString, Matches, MinLength } from 'class-validator';
import { Currency, Network } from '@prisma/client';

export class RequestWithdrawalDto {
  @IsEnum(Currency)
  currency: Currency;

  @IsNumberString()
  amount: string;

  @IsString()
  @MinLength(10, { message: 'Enter a valid destination address' })
  toAddress: string;

  @IsEnum(Network)
  network: Network;

  @IsString()
  @Matches(/^\d{6}$/, { message: 'Enter your 6-digit 2FA code' })
  twoFaCode: string;
}
