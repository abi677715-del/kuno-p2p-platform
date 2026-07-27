import { IsEnum, IsNumberString, IsArray, ArrayNotEmpty, IsString, IsOptional, MaxLength } from 'class-validator';
import { AdSide } from '@prisma/client';

export class CreateAdDto {
  @IsEnum(AdSide)
  side: AdSide;

  @IsNumberString()
  priceEtb: string;

  @IsNumberString()
  minLimitEtb: string;

  @IsNumberString()
  maxLimitEtb: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  paymentMethods: string[];

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Description must be 500 characters or fewer' })
  description?: string;
}
