import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SendSupportMessageDto {
  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  @MaxLength(700_000, { message: 'Attachment is too large' })
  attachmentUrl?: string;
}
