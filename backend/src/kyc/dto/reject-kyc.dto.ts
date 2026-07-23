import { IsString, MinLength } from 'class-validator';

export class RejectKycDto {
  @IsString()
  @MinLength(5, { message: 'Give a short reason so the user knows what to fix' })
  reason: string;
}
