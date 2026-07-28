import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AdSide, AdStatus, Currency } from '@prisma/client';
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

    // A SELL ad promises up to maxLimitEtb worth of USDT — refuse to post it
    // if the seller doesn't actually hold enough to cover that promise, so
    // buyers never hit a surprise "insufficient balance" at trade time.
    if (dto.side === AdSide.SELL) {
      const wallet = await this.prisma.wallet.findUnique({ where: { userId_currency: { userId, currency: Currency.USDT } } });
      const available = wallet ? parseFloat(wallet.balance.toString()) : 0;
      const maxUsdtNeeded = parseFloat(dto.maxLimitEtb) / parseFloat(dto.priceEtb);
      if (available < maxUsdtNeeded) {
        throw new BadRequestException(
          `You need at least ${maxUsdtNeeded.toFixed(2)} USDT available to cover this ad's max limit — your balance is ${available.toFixed(2)} USDT. Deposit more USDT or lower the max limit.`,
        );
      }
    }

    return this.prisma.ad.create({
      data: {
        userId,
        side: dto.side,
        priceEtb: dto.priceEtb,
        minLimitEtb: dto.minLimitEtb,
        maxLimitEtb: dto.maxLimitEtb,
        paymentMethods: dto.paymentMethods,
        description: dto.description,
      },
    });
  }

  /** Median price across active ads — a live, manipulation-resistant stand-in for a market rate. */
  async getIndicativeRate() {
    const ads = await this.prisma.ad.findMany({
      where: { status: AdStatus.ACTIVE },
      select: { priceEtb: true },
    });
    if (ads.length === 0) {
      return { rate: 123.4, sampleSize: 0 };
    }
    const prices = ads.map((a) => parseFloat(a.priceEtb.toString())).sort((a, b) => a - b);
    const mid = Math.floor(prices.length / 2);
    const median = prices.length % 2 === 0 ? (prices[mid - 1] + prices[mid]) / 2 : prices[mid];
    return { rate: Math.round(median * 100) / 100, sampleSize: prices.length };
  }

  findActive(side?: AdSide) {
    return this.prisma.ad.findMany({
      where: { status: AdStatus.ACTIVE, ...(side ? { side } : {}) },
      include: { user: { select: { id: true, email: true, fullName: true, createdAt: true, lastSeenAt: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const ad = await this.prisma.ad.findUnique({
      where: { id },
      include: { user: { select: { id: true, email: true, fullName: true, lastSeenAt: true } } },
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
