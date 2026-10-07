import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { PushService } from './push.service';
import { MailModule } from '../mail/mail.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [MailModule, JwtModule.register({})],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsGateway, PushService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
