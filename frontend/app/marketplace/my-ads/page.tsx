'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

type Ad = {
  id: string;
  side: 'BUY' | 'SELL';
  priceEtb: string;
  minLimitEtb: string;
  maxLimitEtb: string;
  paymentMethods: string[];
  status: 'ACTIVE' | 'PAUSED';
  createdAt: string;
};

export default function MyAdsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  async function load() {
    try {
      setAds(await apiFetch('/ads/mine'));
    } catch (err: any) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function toggle(ad: Ad) {
    setActionError('');
    try {
      await apiFetch(`/ads/${ad.id}/${ad.status === 'ACTIVE' ? 'pause' : 'reactivate'}`, { method: 'PATCH' });
      load();
    } catch (err: any) {
      setActionError(err.message);
    }
  }

  return (
    <main className="min-h-screen bg-ink px-6 py-10 md:px-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display font-bold text-2xl text-paper">My ads</h1>
          <a href="/marketplace" className="text-sm text-teal hover:underline">
            Back to marketplace
          </a>
        </div>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        {actionError && <p className="text-red-400 text-sm mb-4">{actionError}</p>}

        <div className="space-y-3">
          {ads.map((ad) => (
            <div key={ad.id} className="bg-surface border border-white/10 rounded-xl p-5 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-mono uppercase tracking-wide ${ad.side === 'SELL' ? 'text-teal' : 'text-gold'}`}>
                    {ad.side === 'SELL' ? 'Selling USDT' : 'Buying USDT'}
                  </span>
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                      ad.status === 'ACTIVE' ? 'bg-teal/20 text-teal' : 'bg-white/10 text-muted'
                    }`}
                  >
                    {ad.status}
                  </span>
                </div>
                <p className="font-mono text-paper">{ad.priceEtb} ETB / USDT</p>
                <p className="text-xs text-muted mt-1">
                  Limits {ad.minLimitEtb}–{ad.maxLimitEtb} ETB · {ad.paymentMethods.join(', ')}
                </p>
              </div>
              <button
                onClick={() => toggle(ad)}
                className={`shrink-0 rounded-md px-3 py-1.5 text-sm font-medium ${
                  ad.status === 'ACTIVE'
                    ? 'border border-white/15 text-paper'
                    : 'bg-teal text-ink'
                }`}
              >
                {ad.status === 'ACTIVE' ? 'Pause' : 'Reactivate'}
              </button>
            </div>
          ))}
          {ads.length === 0 && !error && (
            <p className="text-muted text-sm">You haven't posted any offers yet.</p>
          )}
        </div>
      </div>
    </main>
  );
}
