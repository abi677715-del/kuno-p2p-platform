import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { KycStatus } from '@prisma/client';
import { SubmitKycDto } from './dto/submit-kyc.dto';
import { RejectKycDto } from './dto/reject-kyc.dto';

@Injectable()
export class KycService {
  constructor(private prisma: PrismaService) {}

  async submit(userId: string, dto: SubmitKycDto, documentUrl: string, selfieUrl: string) {
    const existing = await this.prisma.kycRecord.findUnique({ where: { userId } });
    if (existing && existing.status !== KycStatus.REJECTED) {
      throw new BadRequestException('You already have a KYC submission pending or approved');
    }

    if (existing) {
      // Resubmission after a rejection — overwrite and go back to pending.
      return this.prisma.kycRecord.update({
        where: { userId },
        data: {
          idType: dto.idType,
          idNumber: dto.idNumber,
          documentUrl,
          selfieUrl,
          status: KycStatus.PENDING,
          reviewedBy: null,
          reviewedAt: null,
        },
      });
    }

    return this.prisma.kycRecord.create({
      data: { userId, idType: dto.idType, idNumber: dto.idNumber, documentUrl, selfieUrl },
    });
  }

  getMine(userId: string) {
    return this.prisma.kycRecord.findUnique({ where: { userId } });
  }

  listPending() {
    return this.prisma.kycRecord.findMany({
      where: { status: KycStatus.PENDING },
      include: { user: { select: { id: true, email: true, createdAt: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async approve(adminId: string, kycId: string) {
    const record = await this.getById(kycId);
    const updated = await this.prisma.kycRecord.update({
      where: { id: record.id },
      data: { status: KycStatus.APPROVED, reviewedBy: adminId, reviewedAt: new Date() },
    });
    await this.prisma.adminAuditLog.create({
      data: { adminId, action: 'KYC_APPROVED', targetId: record.id },
    });
    return updated;
  }

  async reject(adminId: string, kycId: string, dto: RejectKycDto) {
    const record = await this.getById(kycId);
    const updated = await this.prisma.kycRecord.update({
      where: { id: record.id },
      data: { status: KycStatus.REJECTED, reviewedBy: adminId, reviewedAt: new Date() },
    });
    await this.prisma.adminAuditLog.create({
      data: { adminId, action: `KYC_REJECTED: ${dto.reason}`, targetId: record.id },
    });
    return updated;
  }

  private async getById(id: string) {
    const record = await this.prisma.kycRecord.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('KYC submission not found');
    return record;
  }

  /** Used by Ads/Trades to require an approved KYC before letting someone trade. */
  async assertApproved(userId: string) {
    const record = await this.prisma.kycRecord.findUnique({ where: { userId } });
    if (!record || record.status !== KycStatus.APPROVED) {
      throw new ForbiddenException('Complete identity verification before trading');
    }
  }
}
