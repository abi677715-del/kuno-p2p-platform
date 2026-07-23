import { IsString, MinLength } from 'class-validator';

export class SubmitKycDto {
  @IsString()
  idType: string; // e.g. "National ID", "Passport"

  @IsString()
  @MinLength(3)
  idNumber: string;
}
