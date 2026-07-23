import { IsEnum, IsNumberString, IsString, MinLength } from 'class-validator';
import { Currency } from '@prisma/client';

export class RequestWithdrawalDto {
  @IsEnum(Currency)
  currency: Currency;

  @IsNumberString()
  amount: string;

  @IsString()
  @MinLength(10, { message: 'Enter a valid destination address' })
  toAddress: string;
}
