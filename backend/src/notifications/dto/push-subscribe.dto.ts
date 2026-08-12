import { IsObject, IsString } from 'class-validator';

export class PushSubscribeDto {
  @IsString()
  endpoint: string;

  @IsObject()
  keys: { p256dh: string; auth: string };
}
