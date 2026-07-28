'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { displayName } from '@/lib/displayName';
import { formatAmount } from '@/lib/format';

const ONLINE_WINDOW_MS = 5 * 60 * 1000;

function isOnline(lastSeenAt?: string) {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() < ONLINE_WINDOW_MS;
}

const TIER_COLOR: Record<string, string> = {
  'Top Merchant': 'bg-gold/20 text-gold',
  Verified: 'bg-teal/20 text-teal',
  Trader: 'bg-white/10 text-muted',
};

export default function AdDetailPage() {
  const params = useParams();
  const adId = params.id as string;
  const [ad, setAd] = useState<any>(null);
  const [amountUsdt, setAmountUsdt] = useState('50');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [relations, setRelations] = useState<any[]>([]);
  const [relationBusy, setRelationBusy] = useState(false);

  useEffect(() => {
    apiFetch(`/ads/${adId}`).then(setAd).catch((e) => setError(e.message));
    apiFetch('/relations/mine').then(setRelations).catch(() => {});
  }, [adId]);

  async function startTrade(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const trade = await apiFetch('/trades', {
        method: 'POST',
        body: JSON.stringify({ adId, amountUsdt }),
      });
      window.location.href = `/trades/${trade.id}`;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function toggleRelation(type: 'block' | 'favorite') {
    if (!ad) return;
    setRelationBusy(true);
    try {
      const active = relations.some((r) => r.targetUser.id === ad.user.id && r.type === type.toUpperCase());
      await apiFetch(`/relations/${ad.user.id}/${type}`, { method: active ? 'DELETE' : 'POST' });
      setRelations(await apiFetch('/relations/mine'));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRelationBusy(false);
    }
  }

  if (!ad) return <main className="min-h-screen bg-ink px-6 py-10 text-muted">{error || 'Loading…'}</main>;

  const isBlocked = relations.some((r) => r.targetUser.id === ad.user.id && r.type === 'BLOCK');
  const isFavorited = relations.some((r) => r.targetUser.id === ad.user.id && r.type === 'FAVORITE');

  return (
    <main className="min-h-screen bg-ink px-6 py-10 md:px-12">
      <div className="max-w-md mx-auto bg-surface border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <span className={`text-xs font-mono uppercase ${ad.side === 'SELL' ? 'text-teal' : 'text-gold'}`}>
            {ad.side === 'SELL' ? 'Selling USDT' : 'Buying USDT'}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleRelation('favorite')}
              disabled={relationBusy}
              className={`text-xs disabled:opacity-50 ${isFavorited ? 'text-gold' : 'text-muted hover:text-gold'}`}
              title="Favorite this trader"
            >
              {isFavorited ? '★ Favorited' : '☆ Favorite'}
            </button>
            <button
              onClick={() => toggleRelation('block')}
              disabled={relationBusy}
              className={`text-xs disabled:opacity-50 ${isBlocked ? 'text-red-400' : 'text-muted hover:text-red-400'}`}
              title="Block this trader"
            >
              {isBlocked ? 'Unblock' : 'Block'}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${isOnline(ad.user.lastSeenAt) ? 'bg-teal' : 'bg-muted'}`} />
          <p className="text-paper font-medium">{displayName(ad.user)}</p>
          <span className="text-[11px] text-muted">{isOnline(ad.user.lastSeenAt) ? 'Online' : 'Offline'}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          {ad.user.isMerchant && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-teal/20 text-teal" title="Verified merchant — 1% trade fee">
              Merchant
            </span>
          )}
          {ad.user.tier && (
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${TIER_COLOR[ad.user.tier] ?? 'bg-white/10 text-muted'}`}>
              {ad.user.tier}
            </span>
          )}
          {ad.user.completionRate !== null && ad.user.completionRate !== undefined && (
            <span className="text-[11px] text-muted">
              {ad.user.completionRate}% · {ad.user.completedTrades} trades
            </span>
          )}
          {ad.user.avgReleaseMinutes !== null && ad.user.avgReleaseMinutes !== undefined && (
            <span className="text-[11px] text-muted">Avg release {ad.user.avgReleaseMinutes}m</span>
          )}
        </div>
        <p className="font-mono text-2xl text-paper mt-3">
          {formatAmount(ad.effectivePriceEtb ?? ad.priceEtb)} ETB / USDT
          {ad.pricingMode === 'FLOATING' && (
            <span className="text-xs text-teal font-sans ml-2">
              market {ad.marginPercent >= 0 ? '+' : ''}
              {ad.marginPercent}%
            </span>
          )}
        </p>
        <p className="text-xs text-muted mt-1">
          Limits {formatAmount(ad.minLimitEtb)}–{formatAmount(ad.maxLimitEtb)} ETB · {ad.paymentMethods.join(', ')}
        </p>
        {ad.description && <p className="text-sm text-paper/80 mt-3 bg-surfaceRaised rounded-md p-3">{ad.description}</p>}

        <form onSubmit={startTrade} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-xs text-muted block mb-1">Amount of USDT to trade</span>
            <input
              value={amountUsdt}
              onChange={(e) => setAmountUsdt(e.target.value)}
              className="w-full bg-surfaceRaised rounded-md px-3 py-2 text-paper outline-none focus:ring-2 focus:ring-teal"
            />
          </label>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <p className="text-xs text-muted">
            A {ad.user.isMerchant ? '1%' : '2%'} platform fee is deducted from the USDT when this trade completes.
          </p>
          <button
            type="submit"
            disabled={loading || isBlocked}
            className="w-full rounded-md bg-gold py-2 text-ink font-medium hover:bg-gold/90 transition-colors disabled:opacity-60"
          >
            {isBlocked ? 'You have blocked this trader' : loading ? 'Starting trade…' : 'Start trade'}
          </button>
        </form>
      </div>
    </main>
  );
}
