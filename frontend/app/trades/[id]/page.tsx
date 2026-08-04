'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { displayName } from '@/lib/displayName';
import { formatAmount } from '@/lib/format';
import { colorFor, initialsFor } from '@/lib/paymentMethods';

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

export default function TraderProfilePage() {
  const params = useParams();
  const traderId = params.id as string;
  const [trader, setTrader] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch(`/ads/trader/${traderId}`)
      .then(setTrader)
      .catch((err) => setError(err.message));
  }, [traderId]);

  if (!trader) return <main className="min-h-screen bg-ink px-6 py-10 text-muted">{error || 'Loading…'}</main>;

  const initial = displayName(trader).charAt(0).toUpperCase();

  return (
    <main className="min-h-screen bg-ink px-6 py-10 md:px-12">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-surface border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-gold to-teal flex items-center justify-center text-ink font-bold text-xl shrink-0">
              {initial}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-paper font-display font-bold text-lg">{displayName(trader)}</p>
                <span className={`inline-block h-1.5 w-1.5 rounded-full ${isOnline(trader.lastSeenAt) ? 'bg-teal' : 'bg-muted'}`} />
                <span className="text-xs text-muted">{isOnline(trader.lastSeenAt) ? 'Online' : 'Offline'}</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap mt-1">
                {trader.isMerchant && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-teal/20 text-teal" title="Verified merchant — 1% trade fee">
                    Merchant
                  </span>
                )}
                {trader.tier && (
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${TIER_COLOR[trader.tier] ?? 'bg-white/10 text-muted'}`}>
                    {trader.tier}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-5">
            <div className="bg-surfaceRaised rounded-md p-3 text-center">
              <p className="text-lg font-mono text-paper">{trader.completedTrades ?? 0}</p>
              <p className="text-[11px] text-muted mt-0.5">Trades (30d)</p>
            </div>
            <div className="bg-surfaceRaised rounded-md p-3 text-center">
              <p className="text-lg font-mono text-paper">{trader.completionRate !== null && trader.completionRate !== undefined ? `${trader.completionRate}%` : '—'}</p>
              <p className="text-[11px] text-muted mt-0.5">Completion (30d)</p>
            </div>
            <div className="bg-surfaceRaised rounded-md p-3 text-center">
              <p className="text-lg font-mono text-paper">{trader.avgReleaseMinutes !== null && trader.avgReleaseMinutes !== undefined ? `${trader.avgReleaseMinutes}m` : '—'}</p>
              <p className="text-[11px] text-muted mt-0.5">Avg release</p>
            </div>
          </div>

          <p className="text-xs text-muted mt-4">
            Member since {new Date(trader.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}
          </p>
        </div>

        <div>
          <h2 className="font-display font-medium text-paper mb-3">Active offers</h2>
          <div className="space-y-3">
            {trader.ads.map((ad: any) => (
              <a
                key={ad.id}
                href={`/marketplace/${ad.id}`}
                className="block bg-surface border border-white/10 rounded-xl p-5 hover:border-white/25 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`text-xs font-mono uppercase tracking-wide ${ad.side === 'SELL' ? 'text-teal' : 'text-gold'}`}>
                      {ad.side === 'SELL' ? 'Selling USDT' : 'Buying USDT'}
                    </span>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {ad.paymentMethods.map((method: string) => (
                        <span
                          key={method}
                          title={method}
                          className="flex items-center justify-center h-5 w-5 rounded-full text-[9px] font-bold text-white"
                          style={{ backgroundColor: colorFor(method) }}
                        >
                          {initialsFor(method)}
                        </span>
                      ))}
                    </div>
                    {ad.description && <p className="text-xs text-muted mt-1.5 max-w-sm">{ad.description}</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-lg text-paper">{formatAmount(ad.effectivePriceEtb ?? ad.priceEtb)} ETB</p>
                    <p className="text-xs text-muted">
                      Limits {formatAmount(ad.minLimitEtb)}–{formatAmount(ad.maxLimitEtb)} ETB
                    </p>
                  </div>
                </div>
              </a>
            ))}
            {trader.ads.length === 0 && <p className="text-muted text-sm">No active offers right now.</p>}
          </div>
        </div>
      </div>
    </main>
  );
}
