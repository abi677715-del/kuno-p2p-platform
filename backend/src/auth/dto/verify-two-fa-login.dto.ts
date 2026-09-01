import { IsString, Length } from 'class-validator';

export class VerifyTwoFaLoginDto {
  @IsString()
  preAuthToken: string;

  @IsString()
  @Length(6, 12, { message: 'Enter the 6-digit code from your authenticator app, or a backup code' })
  code: string;
}
