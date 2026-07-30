import { IsString, MinLength } from 'class-validator';

export class CreateAppealDto {
  @IsString()
  transactionId: string;

  @IsString()
  @MinLength(10, { message: 'Please explain why you’re appealing this transaction in a bit more detail' })
  reason: string;
}
