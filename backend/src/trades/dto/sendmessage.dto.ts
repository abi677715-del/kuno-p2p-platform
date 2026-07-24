import { IsOptional, IsString, MinLength } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @MinLength(1)
  message: string;

  @IsOptional()
  @IsString()
  attachmentUrl?: string;
}
