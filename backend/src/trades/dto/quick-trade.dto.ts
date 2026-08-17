import { IsEnum, IsNumberString } from 'class-validator';
import { AdSide } from '@prisma/client';

export class QuickTradeDto {
  @IsEnum(AdSide)
  side: AdSide;

  @IsNumberString()
  amountUsdt: string;
}
