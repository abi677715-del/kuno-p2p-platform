import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AppealStatus } from '@prisma/client';
import { CreateAppealDto } from './dto/create-appeal.dto';

@Injectable()
export class AppealsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateAppealDto) {
    const transaction = await this.prisma.walletTransaction.findUnique({
      where: { id: dto.transactionId },
      include: { wallet: true },
    });
    if (!transaction) throw new NotFoundException('Transaction not found');
    if (transaction.wallet.userId !== userId) {
      throw new ForbiddenException('You can only appeal your own transactions');
    }

    const existing = await this.prisma.transactionAppeal.findFirst({
      where: { transactionId: dto.transactionId, status: AppealStatus.OPEN },
    });
    if (existing) throw new BadRequestException('There’s already an open appeal for this transaction');

    return this.prisma.transactionAppeal.create({
      data: { transactionId: dto.transactionId, userId, reason: dto.reason },
    });
  }

  listMine(userId: string) {
    return this.prisma.transactionAppeal.findMany({
      where: { userId },
      include: { transaction: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  listOpen() {
    return this.prisma.transactionAppeal.findMany({
      where: { status: AppealStatus.OPEN },
      include: { transaction: true, user: { select: { email: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async resolve(adminId: string, id: string, resolution: string) {
    return this.setStatus(adminId, id, AppealStatus.RESOLVED, resolution);
  }

  async dismiss(adminId: string, id: string, resolution: string) {
    return this.setStatus(adminId, id, AppealStatus.DISMISSED, resolution);
  }

  private async setStatus(adminId: string, id: string, status: AppealStatus, resolution: string) {
    const record = await this.prisma.transactionAppeal.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Appeal not found');
    if (record.status !== AppealStatus.OPEN) throw new BadRequestException('Appeal already handled');

    const updated = await this.prisma.transactionAppeal.update({
      where: { id },
      data: { status, resolution, resolvedBy: adminId, resolvedAt: new Date() },
    });
    await this.prisma.adminAuditLog.create({
      data: { adminId, action: `APPEAL_${status}`, targetId: id },
    });
    return updated;
  }
}
