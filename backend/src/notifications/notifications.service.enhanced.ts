import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { NotificationsGateway } from './notifications.gateway';
import { MailService } from '../mail/mail.service';
import { NotificationPreferencesService } from './notification-preferences.service';
import { NotificationTemplatesService } from './notification-templates.service';
import { Prisma } from '@prisma/client';

export interface NotificationEmail {
  subject: string;
  message: string;
  tradeId?: string;
  kycId?: string;
  disputeId?: string;
  withdrawalId?: string;
}

@Injectable()
export class NotificationsServiceEnhanced {
  constructor(
    private prisma: PrismaService,
    private gateway: NotificationsGateway,
    private mailService: MailService,
    private preferencesService: NotificationPreferencesService,
    private templatesService: NotificationTemplatesService,
  ) {}

  async create(
    userId: string,
    type: string,
    payload: Prisma.InputJsonValue,
    email?: NotificationEmail,
  ) {
    // Check user preferences for in-app notifications
    const shouldSendInApp = await this.preferencesService.shouldSendInAppNotification(
      userId,
      type,
    );

    // Create in-app notification if enabled
    let notification = null;
    if (shouldSendInApp) {
      notification = await this.prisma.notification.create({
        data: { userId, type, payload },
      });
      this.gateway.push(userId, notification);
    }

    // Check user preferences for email notifications
    const shouldSendEmail = await this.preferencesService.shouldSendEmailNotification(
      userId,
      type,
    );

    // Send email if enabled
    if (shouldSendEmail && email) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });
      if (user) {
        const template = this.templatesService.getTemplate(type);
        const htmlContent = this.templatesService.getHtmlEmailTemplate(
          type,
          email.tradeId || email.kycId || email.disputeId || email.withdrawalId,
          email.message,
        );
        await this.mailService.sendHtmlEmail(user.email, email.subject, htmlContent);
      }
    }

    // Check user preferences for SMS notifications
    const shouldSendSms = await this.preferencesService.shouldSendSmsNotification(
      userId,
      type,
    );

    // TODO: Implement SMS sending when SMS provider is configured
    // if (shouldSendSms) {
    //   await this.smsService.send(userId, type, email?.message);
    // }

    return notification;
  }

  listMine(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markRead(userId: string, id: string) {
    await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { readAt: new Date() },
    });
    return { ok: true };
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { ok: true };
  }

  async delete(userId: string, id: string) {
    await this.prisma.notification.deleteMany({ where: { id, userId } });
    return { ok: true };
  }

  async deleteAll(userId: string) {
    await this.prisma.notification.deleteMany({ where: { userId } });
    return { ok: true };
  }

  getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, readAt: null },
    });
  }
}
