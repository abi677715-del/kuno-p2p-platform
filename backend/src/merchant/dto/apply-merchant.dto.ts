import { IsString, MinLength } from 'class-validator';

export class ApplyMerchantDto {
  @IsString()
  @MinLength(20, { message: 'Tell us a bit more about why you want merchant status (at least 20 characters)' })
  reason: string;
}
