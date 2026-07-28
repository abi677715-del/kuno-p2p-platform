import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AdSide, AdStatus, Currency, TradeStatus } from '@prisma/client';
import { CreateAdDto } from './dto/create-ad.dto';
import { KycService } from '../kyc/kyc.service';

function tierFor(completedTrades: number): string | null {
  if (completedTrades >= 50) return 'Top Merchant';
  if (completedTrades >= 10) return 'Verified';
  if (completedTrades >= 1) return 'Trader';
  return null;
}

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

  /** Trade count + completion rate for the ad's poster, computed across both their buy and sell trades. */
  private async attachMerchantStats<T extends { user: { id: string } }>(ads: T[]): Promise<T[]> {
    const userIds = [...new Set(ads.map((a) => a.user.id))];
    const statsByUser = new Map<string, { completedTrades: number; completionRate: number | null; tier: string | null }>();

    await Promise.all(
      userIds.map(async (userId) => {
        const [completed, finished] = await Promise.all([
          this.prisma.trade.count({ where: { OR: [{ buyerId: userId }, { sellerId: userId }], status: TradeStatus.COMPLETED } }),
          this.prisma.trade.count({
            where: {
              OR: [{ buyerId: userId }, { sellerId: userId }],
              status: { in: [TradeStatus.COMPLETED, TradeStatus.CANCELLED, TradeStatus.DISPUTED] },
            },
          }),
        ]);
        statsByUser.set(userId, {
          completedTrades: completed,
          completionRate: finished > 0 ? Math.round((completed / finished) * 100) : null,
          tier: tierFor(completed),
        });
      }),
    );

    return ads.map((ad) => ({ ...ad, user: { ...ad.user, ...statsByUser.get(ad.user.id) } }));
  }

  async findActive(side?: AdSide) {
    const ads = await this.prisma.ad.findMany({
      where: { status: AdStatus.ACTIVE, ...(side ? { side } : {}) },
      include: { user: { select: { id: true, email: true, fullName: true, createdAt: true, lastSeenAt: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return this.attachMerchantStats(ads);
  }

  async findById(id: string) {
    const ad = await this.prisma.ad.findUnique({
      where: { id },
      include: { user: { select: { id: true, email: true, fullName: true, lastSeenAt: true } } },
    });
    if (!ad) throw new NotFoundException('Ad not found');
    const [withStats] = await this.attachMerchantStats([ad]);
    return withStats;
  }

  async pause(userId: string, id: string) {
    const ad = await this.findById(id);
    if (ad.userId !== userId) throw new ForbiddenException('Not your ad');
    return this.prisma.ad.update({ where: { id }, data: { status: AdStatus.PAUSED } });
  }
}
