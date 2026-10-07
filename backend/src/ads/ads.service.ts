import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { BannerAdStatus, BannerPlacement } from '@prisma/client';
import { SubmitBannerAdDto } from './dto/submit-banner-ad.dto';
import { RejectBannerAdDto } from './dto/reject-banner-ad.dto';

@Injectable()
export class BannerAdsService {
  constructor(private prisma: PrismaService) {}

  submit(dto: SubmitBannerAdDto, videoUrl: string) {
    return this.prisma.bannerAd.create({
      data: {
        advertiserName: dto.advertiserName,
        advertiserEmail: dto.advertiserEmail,
        title: dto.title,
        linkUrl: dto.linkUrl,
        videoUrl,
        placements: dto.placements,
      },
    });
  }

  /** Approved ads for a given slot — or all approved ads if no placement is given. */
  listActive(placement?: BannerPlacement) {
    return this.prisma.bannerAd.findMany({
      where: {
        status: BannerAdStatus.APPROVED,
        ...(placement ? { placements: { has: placement } } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  listPending() {
    return this.prisma.bannerAd.findMany({
      where: { status: BannerAdStatus.PENDING },
      orderBy: { createdAt: 'asc' },
    });
  }

  async approve(adminId: string, id: string) {
    const record = await this.getById(id);
    const updated = await this.prisma.bannerAd.update({
      where: { id: record.id },
      data: { status: BannerAdStatus.APPROVED, reviewedBy: adminId, reviewedAt: new Date() },
    });
    await this.prisma.adminAuditLog.create({
      data: { adminId, action: 'BANNER_AD_APPROVED', targetId: record.id },
    });
    return updated;
  }

  async reject(adminId: string, id: string, dto: RejectBannerAdDto) {
    const record = await this.getById(id);
    const updated = await this.prisma.bannerAd.update({
      where: { id: record.id },
      data: { status: BannerAdStatus.REJECTED, rejectionReason: dto.reason, reviewedBy: adminId, reviewedAt: new Date() },
    });
    await this.prisma.adminAuditLog.create({
      data: { adminId, action: `BANNER_AD_REJECTED: ${dto.reason}`, targetId: record.id },
    });
    return updated;
  }

  private async getById(id: string) {
    const record = await this.prisma.bannerAd.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Banner ad submission not found');
    return record;
  }
}
