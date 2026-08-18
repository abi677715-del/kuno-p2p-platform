import { IsString, MinLength } from 'class-validator';

export class RejectBannerAdDto {
  @IsString()
  @MinLength(5, { message: 'Give a short reason so the advertiser knows what to fix' })
  reason: string;
}
