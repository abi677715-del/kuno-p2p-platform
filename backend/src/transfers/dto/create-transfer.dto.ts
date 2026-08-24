import { IsNumberString, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateTransferDto {
  @IsString()
  recipientBid: string;

  @IsNumberString()
  amount: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  note?: string;

  @IsString()
  @Matches(/^\d{6}$/, { message: 'Enter your 6-digit 2FA code' })
  twoFaCode: string;
}
