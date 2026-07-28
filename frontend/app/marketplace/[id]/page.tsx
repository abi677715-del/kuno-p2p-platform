'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { displayName } from '@/lib/displayName';

const ONLINE_WINDOW_MS = 5 * 60 * 1000;

function isOnline(lastSeenAt?: string) {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() < ONLINE_WINDOW_MS;
}

export default function AdDetailPage() {
  const params = useParams();
  const adId = params.id as string;
  const [ad, setAd] = useState<any>(null);
  const [amountUsdt, setAmountUsdt] = useState('50');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch(`/ads/${adId}`).then(setAd).catch((e) => setError(e.message));
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

  if (!ad) return <main className="min-h-screen bg-ink px-6 py-10 text-muted">{error || 'Loading…'}</main>;

  return (
    <main className="min-h-screen bg-ink px-6 py-10 md:px-12">
      <div className="max-w-md mx-auto bg-surface border border-white/10 rounded-xl p-6">
        <span className={`text-xs font-mono uppercase ${ad.side === 'SELL' ? 'text-teal' : 'text-gold'}`}>
          {ad.side === 'SELL' ? 'Selling USDT' : 'Buying USDT'}
        </span>
        <div className="flex items-center gap-1.5 mt-1">
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${isOnline(ad.user.lastSeenAt) ? 'bg-teal' : 'bg-muted'}`} />
          <p className="text-paper font-medium">{displayName(ad.user)}</p>
          <span className="text-[11px] text-muted">{isOnline(ad.user.lastSeenAt) ? 'Online' : 'Offline'}</span>
        </div>
        <p className="font-mono text-2xl text-paper mt-3">{ad.priceEtb} ETB / USDT</p>
        <p className="text-xs text-muted mt-1">
          Limits {ad.minLimitEtb}–{ad.maxLimitEtb} ETB · {ad.paymentMethods.join(', ')}
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
            A 2% platform fee is deducted from the USDT when this trade completes.
          </p>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-gold py-2 text-ink font-medium hover:bg-gold/90 transition-colors disabled:opacity-60"
          >
            {loading ? 'Starting trade…' : 'Start trade'}
          </button>
        </form>
      </div>
    </main>
  );
}
