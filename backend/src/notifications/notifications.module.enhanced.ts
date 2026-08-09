import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsServiceEnhanced } from './notifications.service.enhanced';
import { NotificationPreferencesService } from './notification-preferences.service';
import { NotificationPreferencesController } from './notifications-preferences.controller';
import { NotificationTemplatesService } from './notification-templates.service';
import { NotificationAdminService } from './notification-admin.service';
import { MailModule } from '../mail/mail.module';
import { PrismaModule } from '../common/prisma.module';

@Module({
  imports: [MailModule, PrismaModule],
  controllers: [NotificationsController, NotificationPreferencesController],
  providers: [
    NotificationsServiceEnhanced,
    NotificationPreferencesService,
    NotificationTemplatesService,
    NotificationAdminService,
    NotificationsGateway,
  ],
  exports: [
    NotificationsServiceEnhanced,
    NotificationPreferencesService,
    NotificationTemplatesService,
    NotificationAdminService,
  ],
})
export class NotificationsModuleEnhanced {}
