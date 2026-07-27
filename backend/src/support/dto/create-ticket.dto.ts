import { IsString, MinLength } from 'class-validator';

export class CreateTicketDto {
  @IsString()
  @MinLength(3, { message: 'Give a short subject for your request' })
  subject: string;

  @IsString()
  @MinLength(10, { message: 'Please describe your issue in at least 10 characters' })
  message: string;
}
