import { IsPositiveAmount } from '../../common/positive-amount';
import { IsEnum, IsNumberString } from 'class-validator';
import { AdSide } from '@prisma/client';

export class QuickTradeDto {
  @IsEnum(AdSide)
  side: AdSide;

  @IsPositiveAmount()
  amountUsdt: string;
}
