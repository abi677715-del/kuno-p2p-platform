'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { displayName } from '@/lib/displayName';

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'text-muted',
  ESCROW_LOCKED: 'text-gold',
  PAID: 'text-gold',
  COMPLETED: 'text-teal',
  DISPUTED: 'text-red-400',
  CANCELLED: 'text-muted',
};

export default function TradesListPage() {
  const [trades, setTrades] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/trades')
      .then(setTrades)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <main className="min-h-screen bg-ink px-6 py-10 md:px-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-display font-bold text-2xl text-paper mb-6">Your trades</h1>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <div className="space-y-3">
          {trades.map((t) => (
            <a
              key={t.id}
              href={`/trades/${t.id}`}
              className="block bg-surface border border-white/10 rounded-xl p-5 hover:border-white/25 transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-mono uppercase tracking-wide ${STATUS_COLOR[t.status] ?? 'text-muted'}`}>
                  {t.status}
                </span>
                <span className="font-mono text-paper">
                  {t.amountUsdt} USDT ≈ {t.amountEtb} ETB
                </span>
              </div>
              <p className="text-xs text-muted">
                {displayName(t.buyer)} (buyer) ↔ {displayName(t.seller)} (seller)
              </p>
            </a>
          ))}
          {trades.length === 0 && !error && <p className="text-muted text-sm">No trades yet.</p>}
        </div>
      </div>
    </main>
  );
}
