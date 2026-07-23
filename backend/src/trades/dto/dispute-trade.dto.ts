import { IsString, MinLength } from 'class-validator';

export class DisputeTradeDto {
  @IsString()
  @MinLength(10, { message: 'Please describe the issue in at least 10 characters' })
  reason: string;
}
