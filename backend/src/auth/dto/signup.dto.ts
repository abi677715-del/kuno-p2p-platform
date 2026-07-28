import { IsEmail, IsString, MinLength, IsPhoneNumber, IsOptional } from 'class-validator';

export class SignupDto {
  @IsString()
  @MinLength(2, { message: 'Please enter your full name' })
  fullName: string;

  @IsEmail()
  email: string;

  @IsPhoneNumber()
  phone: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  @IsOptional()
  @IsString()
  ref?: string;
}
