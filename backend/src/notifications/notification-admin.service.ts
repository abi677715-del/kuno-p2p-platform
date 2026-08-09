import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { NotificationsService } from './notifications.service';
import { Role } from '@prisma/client';

@Injectable()
export class NotificationAdminService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async notifyAdminsNewKycSubmission(userId: string, kycId: string) {
    const admins = await this.getAdminIds();
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, fullName: true },
    });

    for (const adminId of admins) {
      await this.notificationsService.create(
        adminId,
        'ADMIN_KYC_PENDING',
        { userId, kycId, userEmail: user?.email, userName: user?.fullName },
        {
          subject: `New KYC submission from ${user?.fullName || user?.email}`,
          message: `A new KYC submission requires review. User: ${user?.fullName || user?.email}`,
          kycId,
        },
      );
    }
  }

  async notifyAdminsNewWithdrawalRequest(userId: string, withdrawalId: string, amount: string) {
    const admins = await this.getAdminIds();
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, fullName: true },
    });

    for (const adminId of admins) {
      await this.notificationsService.create(
        adminId,
        'ADMIN_WITHDRAWAL_PENDING',
        { userId, withdrawalId, amount, userEmail: user?.email },
        {
          subject: `Withdrawal request pending: ${amount} USDT from ${user?.fullName || user?.email}`,
          message: `A withdrawal request for ${amount} USDT requires confirmation. User: ${user?.email}`,
          withdrawalId,
        },
      );
    }
  }

  async notifyAdminsNewDispute(tradeId: string, disputeId: string, raisedBy: string) {
    const admins = await this.getAdminIds();
    const user = await this.prisma.user.findUnique({
      where: { id: raisedBy },
      select: { email: true },
    });

    for (const adminId of admins) {
      await this.notificationsService.create(
        adminId,
        'ADMIN_DISPUTE_OPEN',
        { tradeId, disputeId, raisedBy, raiserEmail: user?.email },
        {
          subject: `New dispute opened on trade ${tradeId.slice(0, 8)}...`,
          message: `A dispute has been raised that requires admin review. Raised by: ${user?.email}`,
          disputeId,
        },
      );
    }
  }

  private async getAdminIds(): Promise<string[]> {
    const admins = await this.prisma.user.findMany({
      where: { role: Role.ADMIN },
      select: { id: true },
    });
    return admins.map((a) => a.id);
  }
}
