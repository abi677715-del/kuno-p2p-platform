'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [error, setError] = useState('');

  async function load() {
    try {
      setTickets(await apiFetch('/support/admin/tickets'));
    } catch (err: any) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function resolve(id: string) {
    await apiFetch(`/support/admin/tickets/${id}/resolve`, { method: 'POST' });
    load();
  }

  return (
    <main className="min-h-screen bg-ink px-6 py-10 md:px-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-display font-bold text-2xl text-paper mb-6">Support tickets</h1>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <div className="space-y-4">
          {tickets.map((t) => (
            <div key={t.id} className="bg-surface border border-white/10 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-paper font-medium">{t.subject}</p>
                <span className={t.status === 'RESOLVED' ? 'text-teal text-xs' : 'text-gold text-xs'}>
                  {t.status}
                </span>
              </div>
              <p className="text-xs text-muted mb-2">{t.user.email}</p>
              <p className="text-sm text-paper mb-4">{t.message}</p>
              {t.status !== 'RESOLVED' && (
                <button
                  onClick={() => resolve(t.id)}
                  className="rounded-md bg-gradient-to-br from-gold to-teal px-3 py-1.5 text-ink text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Mark resolved
                </button>
              )}
            </div>
          ))}
          {tickets.length === 0 && !error && <p className="text-muted text-sm">No support tickets.</p>}
        </div>
      </div>
    </main>
  );
}
