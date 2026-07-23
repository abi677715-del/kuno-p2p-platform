'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function AdminRevenuePage() {
  const [wallets, setWallets] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/wallet/admin/platform-balance').then(setWallets).catch((e) => setError(e.message));
  }, []);

  return (
    <main className="min-h-screen bg-ink px-6 py-10 md:px-12">
      <div className="max-w-md mx-auto">
        <h1 className="font-display font-bold text-2xl text-paper mb-2">Platform revenue</h1>
        <p className="text-xs text-muted mb-6">
          2% commission collected from completed trades, held in the platform's own wallet.
        </p>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        <div className="grid grid-cols-2 gap-4">
          {wallets.map((w) => (
            <div key={w.id} className="bg-surface border border-white/10 rounded-xl p-5">
              <p className="text-xs text-muted mb-1">{w.currency}</p>
              <p className="font-mono text-xl text-gold">{w.balance}</p>
            </div>
          ))}
          {wallets.length === 0 && !error && <p className="text-muted text-sm">No commission collected yet.</p>}
        </div>
      </div>
    </main>
  );
}
