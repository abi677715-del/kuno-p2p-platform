import { IsNumberString, IsUUID } from 'class-validator';

export class CreateTradeDto {
  @IsUUID()
  adId: string;

  @IsNumberString()
  amountUsdt: string;
}
