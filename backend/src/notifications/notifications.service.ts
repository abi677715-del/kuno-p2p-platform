import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { NotificationsGateway } from './notifications.gateway';
import { MailService } from '../mail/mail.service';
import { Prisma } from '@prisma/client';

export interface NotificationEmail {
  subject: string;
  message: string;
  tradeId: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private gateway: NotificationsGateway,
    private mailService: MailService,
  ) {}

  async create(userId: string, type: string, payload: Prisma.InputJsonValue, email?: NotificationEmail) {
    const notification = await this.prisma.notification.create({ data: { userId, type, payload } });
    this.gateway.push(userId, notification);

    if (email) {
      const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
      if (user) {
        await this.mailService.sendTradeUpdateEmail(user.email, email.subject, email.message, email.tradeId);
      }
    }

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
}
