import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AdSide, AdStatus } from '@prisma/client';
import { CreateAdDto } from './dto/create-ad.dto';
import { KycService } from '../kyc/kyc.service';

@Injectable()
export class AdsService {
  constructor(
    private prisma: PrismaService,
    private kycService: KycService,
  ) {}

  async create(userId: string, dto: CreateAdDto) {
    await this.kycService.assertApproved(userId);
    return this.prisma.ad.create({
      data: {
        userId,
        side: dto.side,
        priceEtb: dto.priceEtb,
        minLimitEtb: dto.minLimitEtb,
        maxLimitEtb: dto.maxLimitEtb,
        paymentMethods: dto.paymentMethods,
      },
    });
  }

  findActive(side?: AdSide) {
    return this.prisma.ad.findMany({
      where: { status: AdStatus.ACTIVE, ...(side ? { side } : {}) },
      include: { user: { select: { id: true, email: true, createdAt: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const ad = await this.prisma.ad.findUnique({
      where: { id },
      include: { user: { select: { id: true, email: true } } },
    });
    if (!ad) throw new NotFoundException('Ad not found');
    return ad;
  }

  async pause(userId: string, id: string) {
    const ad = await this.findById(id);
    if (ad.userId !== userId) throw new ForbiddenException('Not your ad');
    return this.prisma.ad.update({ where: { id }, data: { status: AdStatus.PAUSED } });
  }
}
