import { Transform } from 'class-transformer';
import { ArrayMinSize, IsArray, IsEmail, IsEnum, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';
import { BannerPlacement } from '@prisma/client';

export class SubmitBannerAdDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  advertiserName: string;

  @IsEmail()
  advertiserEmail: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  title: string;

  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  linkUrl: string;

  // Sent as a JSON-stringified array in the multipart form (e.g. '["MARKETPLACE","HOMEPAGE"]')
  // since plain form fields arrive as strings — this normalizes it back to an array before validation.
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    try {
      return JSON.parse(value);
    } catch {
      return value.split(',').map((v) => v.trim());
    }
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(BannerPlacement, { each: true })
  placements: BannerPlacement[];
}
