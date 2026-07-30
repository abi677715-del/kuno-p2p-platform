'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { formatAmount } from '@/lib/format';

export default function AdminAppealsPage() {
  const [appeals, setAppeals] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [resolutionById, setResolutionById] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    try {
      setAppeals(await apiFetch('/appeals/admin/open'));
    } catch (err: any) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function act(id: string, action: 'resolve' | 'dismiss') {
    const resolution = (resolutionById[id] || '').trim();
    if (!resolution) {
      setError('Add a short note explaining the decision before resolving or dismissing.');
      return;
    }
    setBusyId(id);
    setError('');
    try {
      await apiFetch(`/appeals/admin/${id}/${action}`, {
        method: 'POST',
        body: JSON.stringify({ resolution }),
      });
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="min-h-screen bg-ink px-6 py-10 md:px-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-display font-bold text-2xl text-paper mb-1">Transaction appeals</h1>
        <p className="text-xs text-muted mb-6">
          Users can appeal any deposit, withdrawal, or trade-related transaction they believe was handled incorrectly.
        </p>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <div className="space-y-4">
          {appeals.map((a) => (
            <div key={a.id} className="bg-surface border border-white/10 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2 gap-3">
                <p className="text-paper font-medium">{a.user?.email}</p>
                <span className="text-gold text-xs">OPEN</span>
              </div>
              <p className="text-xs text-muted mb-1">
                {a.transaction?.type} · {formatAmount(a.transaction?.amount ?? '0', 4)} USDT · {a.transaction?.status}
              </p>
              {a.transaction?.code && <p className="font-mono text-[11px] text-muted/70 mb-3">{a.transaction.code}</p>}
              <p className="text-sm text-paper mb-4">{a.reason}</p>

              <textarea
                value={resolutionById[a.id] || ''}
                onChange={(e) => setResolutionById((prev) => ({ ...prev, [a.id]: e.target.value }))}
                placeholder="Note explaining your decision (shown to the user)"
                rows={2}
                className="w-full bg-surfaceRaised rounded-md px-3 py-2 text-sm text-paper outline-none focus:ring-2 focus:ring-teal mb-3"
              />

              <div className="flex gap-2">
                <button
                  onClick={() => act(a.id, 'resolve')}
                  disabled={busyId === a.id}
                  className="rounded-md bg-gradient-to-br from-gold to-teal px-3 py-1.5 text-ink text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  Resolve (upheld)
                </button>
                <button
                  onClick={() => act(a.id, 'dismiss')}
                  disabled={busyId === a.id}
                  className="rounded-md border border-white/15 px-3 py-1.5 text-paper text-sm font-medium disabled:opacity-50"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
          {appeals.length === 0 && !error && <p className="text-muted text-sm">No open appeals.</p>}
        </div>
      </div>
    </main>
  );
}
