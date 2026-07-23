import { IsString, Length } from 'class-validator';

export class TwoFaCodeDto {
  @IsString()
  @Length(6, 6, { message: 'Enter the 6-digit code from your authenticator app' })
  code: string;
}
