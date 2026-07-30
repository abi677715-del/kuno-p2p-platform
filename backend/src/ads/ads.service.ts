import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AdSide, AdStatus, AdPricingMode, Currency, TradeStatus } from '@prisma/client';
import { CreateAdDto } from './dto/create-ad.dto';
import { KycService } from '../kyc/kyc.service';
import { UsersService } from '../users/users.service';

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

  /**
   * A SELL ad promises up to maxLimitEtb worth of USDT — refuse to post or
   * reactivate it if the seller doesn't actually hold enough to cover that
   * promise, so buyers never hit a surprise "insufficient balance" at trade time.
   */
  private async assertSellAdFunded(userId: string, priceEtb: string, maxLimitEtb: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId_currency: { userId, currency: Currency.USDT } } });
    const available = wallet ? parseFloat(wallet.balance.toString()) : 0;
    const maxUsdtNeeded = parseFloat(maxLimitEtb) / parseFloat(priceEtb);
    if (available < maxUsdtNeeded) {
      throw new BadRequestException(
        `You need at least ${maxUsdtNeeded.toFixed(2)} USDT available to cover this ad's max limit — your balance is ${available.toFixed(2)} USDT. Deposit more USDT or lower the max limit.`,
      );
    }
  }

  async create(userId: string, dto: CreateAdDto) {
    await this.kycService.assertApproved(userId);

    const pricingMode = dto.pricingMode ?? AdPricingMode.FIXED;
    if (pricingMode === AdPricingMode.FLOATING && dto.marginPercent === undefined) {
      throw new BadRequestException('Floating-price ads need a margin percentage');
    }

    if (dto.side === AdSide.SELL) {
      await this.assertSellAdFunded(userId, dto.priceEtb, dto.maxLimitEtb);
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
        pricingMode,
        marginPercent: dto.marginPercent,
      },
    });
  }

  /**
   * Median price across active fixed-price ads — a live, manipulation-resistant
   * stand-in for a market rate. Floating ads are excluded because they derive
   * their own price FROM this rate, so including them would make it chase
   * itself in a feedback loop.
   */
  async getIndicativeRate() {
    const ads = await this.prisma.ad.findMany({
      where: { status: AdStatus.ACTIVE, pricingMode: AdPricingMode.FIXED },
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

  private async medianFixedPrice(): Promise<number> {
    return (await this.getIndicativeRate()).rate;
  }

  /** Computes the live price for floating ads (market rate ± margin); fixed ads just use their stored price. */
  private async attachEffectivePrice<T extends { pricingMode: AdPricingMode; priceEtb: any; marginPercent: any }>(
    ads: T[],
  ): Promise<(T & { effectivePriceEtb: string })[]> {
    const hasFloating = ads.some((a) => a.pricingMode === AdPricingMode.FLOATING);
    const rate = hasFloating ? await this.medianFixedPrice() : 0;
    return ads.map((ad) => ({
      ...ad,
      effectivePriceEtb:
        ad.pricingMode === AdPricingMode.FLOATING && ad.marginPercent !== null
          ? (rate * (1 + parseFloat(ad.marginPercent.toString()) / 100)).toFixed(4)
          : ad.priceEtb.toString(),
    }));
  }

  /**
   * Trade count, completion rate, and average release time (as seller) for
   * the ad's poster, computed across their trade history.
   */
  private async attachMerchantStats<T extends { user: { id: string } }>(ads: T[]): Promise<T[]> {
    const userIds = [...new Set(ads.map((a) => a.user.id))];
    const statsByUser = new Map<
      string,
      { completedTrades: number; completionRate: number | null; tier: string | null; avgReleaseMinutes: number | null }
    >();

    await Promise.all(
      userIds.map(async (userId) => {
        const [completed, finished, releasedAsSeller] = await Promise.all([
          this.prisma.trade.count({ where: { OR: [{ buyerId: userId }, { sellerId: userId }], status: TradeStatus.COMPLETED } }),
          this.prisma.trade.count({
            where: {
              OR: [{ buyerId: userId }, { sellerId: userId }],
              status: { in: [TradeStatus.COMPLETED, TradeStatus.CANCELLED, TradeStatus.DISPUTED] },
            },
          }),
          this.prisma.trade.findMany({
            where: { sellerId: userId, status: TradeStatus.COMPLETED, paidAt: { not: null }, completedAt: { not: null } },
            select: { paidAt: true, completedAt: true },
            take: 50,
            orderBy: { completedAt: 'desc' },
          }),
        ]);
        const avgReleaseMinutes = releasedAsSeller.length
          ? Math.round(
              releasedAsSeller.reduce((sum, t) => sum + (t.completedAt!.getTime() - t.paidAt!.getTime()), 0) /
                releasedAsSeller.length /
                60_000,
            )
          : null;
        statsByUser.set(userId, {
          completedTrades: completed,
          completionRate: finished > 0 ? Math.round((completed / finished) * 100) : null,
          tier: tierFor(completed),
          avgReleaseMinutes,
        });
      }),
    );

    return ads.map((ad) => ({ ...ad, user: { ...ad.user, ...statsByUser.get(ad.user.id) } }));
  }

  async findActive(side?: AdSide) {
    const ads = await this.prisma.ad.findMany({
      where: { status: AdStatus.ACTIVE, ...(side ? { side } : {}) },
      include: {
        user: { select: { id: true, email: true, fullName: true, createdAt: true, lastSeenAt: true, isMerchant: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    const withStats = await this.attachMerchantStats(ads);
    return this.attachEffectivePrice(withStats);
  }

  async findById(id: string) {
    const ad = await this.prisma.ad.findUnique({
      where: { id },
      include: { user: { select: { id: true, email: true, fullName: true, lastSeenAt: true, isMerchant: true } } },
    });
    if (!ad) throw new NotFoundException('Ad not found');
    const [withStats] = await this.attachMerchantStats([ad]);
    const [withPrice] = await this.attachEffectivePrice([withStats]);
    return withPrice;
  }

  findMine(userId: string) {
    return this.prisma.ad.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  async pause(userId: string, id: string) {
    const ad = await this.findById(id);
    if (ad.userId !== userId) throw new ForbiddenException('Not your ad');
    return this.prisma.ad.update({ where: { id }, data: { status: AdStatus.PAUSED } });
  }

  async reactivate(userId: string, id: string) {
    const ad = await this.findById(id);
    if (ad.userId !== userId) throw new ForbiddenException('Not your ad');
    if (ad.side === AdSide.SELL) {
      await this.assertSellAdFunded(userId, ad.priceEtb.toString(), ad.maxLimitEtb.toString());
    }
    return this.prisma.ad.update({ where: { id }, data: { status: AdStatus.ACTIVE } });
  }

  /**
   * Ads left ACTIVE while their poster has been offline too long are a
   * common source of stuck trades — a buyer starts a trade against them and
   * the seller never shows up to confirm. Auto-pause instead; the poster can
   * manually reactivate (which re-checks funding) once they're back.
   */
  async autoPauseStaleAds(offlineMinutes: number) {
    const cutoff = new Date(Date.now() - offlineMinutes * 60_000);
    const result = await this.prisma.ad.updateMany({
      where: { status: AdStatus.ACTIVE, user: { lastSeenAt: { lt: cutoff } } },
      data: { status: AdStatus.PAUSED },
    });
    return result.count;
  }
}
