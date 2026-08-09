/** Shared trust tier, derived from a trader's completed-trade count — used both for the badge shown on ads/profiles and for volume limits. */
export type TraderTier = 'Top Merchant' | 'Verified' | 'Trader' | null;

export function tierFor(completedTrades: number): TraderTier {
  if (completedTrades >= 50) return 'Top Merchant';
  if (completedTrades >= 10) return 'Verified';
  if (completedTrades >= 1) return 'Trader';
  return null;
}

/** Daily ETB trade-volume cap per tier — new/unrated accounts get the lowest cap. Configurable via env for ops to tune without a deploy of new code. */
const DAILY_LIMIT_ETB: Record<'none' | Exclude<TraderTier, null>, number> = {
  none: parseFloat(process.env.DAILY_LIMIT_ETB_BASE ?? '20000'),
  Trader: parseFloat(process.env.DAILY_LIMIT_ETB_TRADER ?? '75000'),
  Verified: parseFloat(process.env.DAILY_LIMIT_ETB_VERIFIED ?? '250000'),
  'Top Merchant': parseFloat(process.env.DAILY_LIMIT_ETB_TOP ?? '1000000'),
};

const MONTHLY_LIMIT_MULTIPLIER = parseFloat(process.env.MONTHLY_LIMIT_MULTIPLIER ?? '15');

export function dailyLimitFor(tier: TraderTier): number {
  return DAILY_LIMIT_ETB[tier ?? 'none'];
}

export function monthlyLimitFor(tier: TraderTier): number {
  return dailyLimitFor(tier) * MONTHLY_LIMIT_MULTIPLIER;
}
