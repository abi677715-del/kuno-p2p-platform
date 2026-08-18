import { ArrayMinSize, IsArray, IsString, MinLength } from 'class-validator';

export class BulkRejectKycDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  ids: string[];

  @IsString()
  @MinLength(5, { message: 'Give a short reason so users know what to fix' })
  reason: string;
}
