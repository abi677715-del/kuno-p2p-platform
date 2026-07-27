import { IsOptional, IsString, MinLength, IsArray } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Full name is too short' })
  fullName?: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Phone number is too short' })
  phone?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  defaultPaymentMethods?: string[];
}
