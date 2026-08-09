import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { UpdateNotificationPreferencesDto } from './dto/notification-preferences.dto';

export interface NotificationPreferences {
  emailTradeUpdates: boolean;
  emailDisputeAlerts: boolean;
  emailKycUpdates: boolean;
  emailWithdrawalAlerts: boolean;
  inAppTradeUpdates: boolean;
  inAppDisputeAlerts: boolean;
  smsUrgentAlerts: boolean;
  smsDisputeNotifications: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  emailTradeUpdates: true,
  emailDisputeAlerts: true,
  emailKycUpdates: true,
  emailWithdrawalAlerts: true,
  inAppTradeUpdates: true,
  inAppDisputeAlerts: true,
  smsUrgentAlerts: false,
  smsDisputeNotifications: false,
};

@Injectable()
export class NotificationPreferencesService {
  constructor(private prisma: PrismaService) {}

  async getPreferences(userId: string): Promise<NotificationPreferences> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { notificationPreferences: true },
    });
    return user?.notificationPreferences as NotificationPreferences || DEFAULT_PREFERENCES;
  }

  async updatePreferences(
    userId: string,
    dto: UpdateNotificationPreferencesDto,
  ): Promise<NotificationPreferences> {
    const current = await this.getPreferences(userId);
    const updated = { ...current, ...dto };
    await this.prisma.user.update({
      where: { id: userId },
      data: { notificationPreferences: updated },
    });
    return updated;
  }

  async shouldSendEmailNotification(
    userId: string,
    notificationType: string,
  ): Promise<boolean> {
    const prefs = await this.getPreferences(userId);

    switch (notificationType) {
      case 'TRADE_ESCROW_LOCKED':
      case 'TRADE_MARKED_PAID':
      case 'TRADE_COMPLETED':
      case 'TRADE_CANCELLED':
        return prefs.emailTradeUpdates;
      case 'DISPUTE_OPENED':
      case 'DISPUTE_RESOLVED':
        return prefs.emailDisputeAlerts;
      case 'KYC_APPROVED':
      case 'KYC_REJECTED':
        return prefs.emailKycUpdates;
      case 'WITHDRAWAL_CONFIRMED':
      case 'WITHDRAWAL_REJECTED':
      case 'DEPOSIT_CONFIRMED':
      case 'DEPOSIT_REJECTED':
        return prefs.emailWithdrawalAlerts;
      default:
        return true;
    }
  }

  async shouldSendInAppNotification(
    userId: string,
    notificationType: string,
  ): Promise<boolean> {
    const prefs = await this.getPreferences(userId);

    switch (notificationType) {
      case 'TRADE_ESCROW_LOCKED':
      case 'TRADE_MARKED_PAID':
      case 'TRADE_COMPLETED':
      case 'TRADE_CANCELLED':
        return prefs.inAppTradeUpdates;
      case 'DISPUTE_OPENED':
      case 'DISPUTE_RESOLVED':
        return prefs.inAppDisputeAlerts;
      default:
        return true;
    }
  }

  async shouldSendSmsNotification(
    userId: string,
    notificationType: string,
  ): Promise<boolean> {
    const prefs = await this.getPreferences(userId);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true },
    });

    if (!user?.phone) return false;

    switch (notificationType) {
      case 'DISPUTE_OPENED':
      case 'DISPUTE_RESOLVED':
        return prefs.smsDisputeNotifications;
      case 'TRADE_MARKED_PAID':
        return prefs.smsUrgentAlerts;
      default:
        return false;
    }
  }
}
