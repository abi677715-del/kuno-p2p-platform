import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { KycStatus, MerchantApplicationStatus, TradeStatus } from '@prisma/client';
import { ApplyMerchantDto } from './dto/apply-merchant.dto';
import { RejectMerchantDto } from './dto/reject-merchant.dto';
import { NotificationsService } from '../notifications/notifications.service';

// Matches the "Verified" trader tier threshold used on ad listings — merchant
// status shouldn't be reachable before a trader has some track record.
export const MIN_COMPLETED_TRADES_FOR_MERCHANT = 10;

@Injectable()
export class MerchantService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  private async completedTradeCount(userId: string) {
    return this.prisma.trade.count({
      where: { OR: [{ buyerId: userId }, { sellerId: userId }], status: TradeStatus.COMPLETED },
    });
  }

  private async eligibility(userId: string) {
    const [kycRecord, completedTrades] = await Promise.all([
      this.prisma.kycRecord.findUnique({ where: { userId } }),
      this.completedTradeCount(userId),
    ]);
    return {
      kycApproved: kycRecord?.status === KycStatus.APPROVED,
      completedTrades,
      minCompletedTrades: MIN_COMPLETED_TRADES_FOR_MERCHANT,
      meetsTradeMinimum: completedTrades >= MIN_COMPLETED_TRADES_FOR_MERCHANT,
    };
  }

  async getStatus(userId: string) {
    const [user, eligibility, latestApplication] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, select: { isMerchant: true } }),
      this.eligibility(userId),
      this.prisma.merchantApplication.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } }),
    ]);
    return {
      isMerchant: !!user?.isMerchant,
      eligibility,
      application: latestApplication,
    };
  }

  async apply(userId: string, dto: ApplyMerchantDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { isMerchant: true } });
    if (user?.isMerchant) {
      throw new BadRequestException('You already have merchant status');
    }

    const pending = await this.prisma.merchantApplication.findFirst({
      where: { userId, status: MerchantApplicationStatus.PENDING },
    });
    if (pending) {
      throw new BadRequestException('You already have an application under review');
    }

    const eligibility = await this.eligibility(userId);
    if (!eligibility.kycApproved) {
      throw new BadRequestException('Complete identity verification (KYC) before applying');
    }
    if (!eligibility.meetsTradeMinimum) {
      throw new BadRequestException(
        `You need at least ${MIN_COMPLETED_TRADES_FOR_MERCHANT} completed trades to apply — you have ${eligibility.completedTrades}`,
      );
    }

    return this.prisma.merchantApplication.create({
      data: { userId, reason: dto.reason },
    });
  }

  listPending() {
    return this.prisma.merchantApplication.findMany({
      where: { status: MerchantApplicationStatus.PENDING },
      include: { user: { select: { email: true, fullName: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  private async findPendingOrThrow(id: string) {
    const application = await this.prisma.merchantApplication.findUnique({ where: { id } });
    if (!application) throw new NotFoundException('Application not found');
    if (application.status !== MerchantApplicationStatus.PENDING) {
      throw new BadRequestException('This application has already been reviewed');
    }
    return application;
  }

  async approve(id: string) {
    const application = await this.findPendingOrThrow(id);
    const [updated] = await this.prisma.$transaction([
      this.prisma.merchantApplication.update({
        where: { id },
        data: { status: MerchantApplicationStatus.APPROVED, reviewedAt: new Date() },
      }),
      this.prisma.user.update({ where: { id: application.userId }, data: { isMerchant: true } }),
    ]);
    const message = 'Your merchant application was approved — you now trade at a 1% fee.';
    await this.notificationsService.create(application.userId, 'MERCHANT_APPROVED', { message });
    return updated;
  }

  async reject(id: string, dto: RejectMerchantDto) {
    const application = await this.findPendingOrThrow(id);
    const updated = await this.prisma.merchantApplication.update({
      where: { id },
      data: { status: MerchantApplicationStatus.REJECTED, rejectionReason: dto.reason, reviewedAt: new Date() },
    });
    const message = `Your merchant application was rejected: ${dto.reason}`;
    await this.notificationsService.create(application.userId, 'MERCHANT_REJECTED', { message });
    return updated;
  }
}
