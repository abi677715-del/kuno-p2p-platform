import { IsString, MinLength } from 'class-validator';

export class CreateTradeAppealDto {
  @IsString()
  tradeId: string;

  @IsString()
  @MinLength(10, { message: 'Please explain why you’re appealing this trade in a bit more detail' })
  reason: string;
}
