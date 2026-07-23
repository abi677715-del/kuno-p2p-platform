import { IsEnum, IsNumberString, IsArray, ArrayNotEmpty, IsString } from 'class-validator';
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
}
