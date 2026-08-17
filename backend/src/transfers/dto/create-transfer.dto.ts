import { IsNumberString, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTransferDto {
  @IsString()
  recipientBid: string;

  @IsNumberString()
  amount: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  note?: string;
}
