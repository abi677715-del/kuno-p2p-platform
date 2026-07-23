'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [error, setError] = useState('');

  async function load() {
    try {
      setDisputes(await apiFetch('/trades/admin/disputes'));
    } catch (err: any) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function resolve(id: string, outcome: 'RELEASE_TO_BUYER' | 'REFUND_TO_SELLER') {
    const resolution = window.prompt('Note on how this was resolved:');
    if (!resolution) return;
    await apiFetch(`/trades/admin/disputes/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ outcome, resolution }),
    });
    load();
  }

  return (
    <main className="min-h-screen bg-ink px-6 py-10 md:px-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-display font-bold text-2xl text-paper mb-6">Open disputes</h1>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <div className="space-y-4">
          {disputes.map((d) => (
            <div key={d.id} className="bg-surface border border-white/10 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-paper font-medium">
                  {d.trade.buyer.email} (buyer) ↔ {d.trade.seller.email} (seller)
                </p>
                <span className="font-mono text-sm text-gold">
                  {d.trade.amountUsdt} USDT / {d.trade.amountEtb} ETB
                </span>
              </div>
              <p className="text-xs text-muted mb-1">Raised by {d.raisedBy.email}</p>
              <p className="text-sm text-paper mb-4">{d.reason}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => resolve(d.id, 'RELEASE_TO_BUYER')}
                  className="rounded-md bg-teal px-3 py-1.5 text-ink text-sm font-medium"
                >
                  Release to buyer
                </button>
                <button
                  onClick={() => resolve(d.id, 'REFUND_TO_SELLER')}
                  className="rounded-md border border-white/15 px-3 py-1.5 text-paper text-sm font-medium"
                >
                  Refund to seller
                </button>
              </div>
            </div>
          ))}
          {disputes.length === 0 && !error && <p className="text-muted text-sm">No open disputes.</p>}
        </div>
      </div>
    </main>
  );
}
