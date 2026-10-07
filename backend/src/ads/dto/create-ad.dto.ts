import { IsPositiveAmount } from '../../common/positive-amount';
import { IsEnum, IsNumberString, IsArray, ArrayNotEmpty, IsString, IsOptional, MaxLength } from 'class-validator';
import { AdSide, AdPricingMode } from '@prisma/client';

export class CreateAdDto {
  @IsEnum(AdSide)
  side: AdSide;

  @IsPositiveAmount()
  priceEtb: string;

  @IsPositiveAmount()
  minLimitEtb: string;

  @IsPositiveAmount()
  maxLimitEtb: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  paymentMethods: string[];

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Description must be 500 characters or fewer' })
  description?: string;

  @IsOptional()
  @IsEnum(AdPricingMode)
  pricingMode?: AdPricingMode;

  /** Only used when pricingMode is FLOATING — percent above (positive) or below (negative) the live market rate. */
  @IsOptional()
  @IsNumberString()
  marginPercent?: string;
}
