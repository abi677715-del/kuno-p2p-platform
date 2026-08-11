import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class DisputeTradeDto {
  @IsString()
  @MinLength(10, { message: 'Please describe the issue in at least 10 characters' })
  reason: string;

  @IsOptional()
  @IsString()
  @MaxLength(700_000, { message: 'Evidence image is too large' })
  evidenceUrl?: string;
}
