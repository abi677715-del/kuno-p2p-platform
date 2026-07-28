import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { DisputeStatus, KycStatus, SupportTicketStatus, TxStatus, TxType } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  /** Counts of everything waiting on an admin, for a single at-a-glance overview page. */
  async getSummary() {
    const [
      openDisputes,
      pendingKyc,
      pendingDeposits,
      pendingWithdrawals,
      openSupportTickets,
      totalUsers,
      totalMerchants,
    ] = await Promise.all([
      this.prisma.dispute.count({ where: { status: DisputeStatus.OPEN } }),
      this.prisma.kycRecord.count({ where: { status: KycStatus.PENDING } }),
      this.prisma.walletTransaction.count({ where: { type: TxType.DEPOSIT, status: TxStatus.PENDING } }),
      this.prisma.walletTransaction.count({ where: { type: TxType.WITHDRAWAL, status: TxStatus.PENDING } }),
      this.prisma.supportTicket.count({ where: { status: SupportTicketStatus.OPEN } }),
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isMerchant: true } }),
    ]);

    return {
      openDisputes,
      pendingKyc,
      pendingDeposits,
      pendingWithdrawals,
      openSupportTickets,
      totalUsers,
      totalMerchants,
    };
  }
}
