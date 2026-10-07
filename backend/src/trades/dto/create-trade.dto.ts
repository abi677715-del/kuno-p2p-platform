import { IsPositiveAmount } from '../../common/positive-amount';
import { IsNumberString, IsUUID } from 'class-validator';

export class CreateTradeDto {
  @IsUUID()
  adId: string;

  @IsPositiveAmount()
  amountUsdt: string;
}
