'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function AdminMerchantApplicationsPage() {
  const [pending, setPending] = useState<any[]>([]);
  const [error, setError] = useState('');

  async function load() {
    try {
      setPending(await apiFetch('/merchant/admin/pending'));
    } catch (err: any) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(id: string) {
    await apiFetch(`/merchant/admin/${id}/approve`, { method: 'POST' });
    load();
  }

  async function reject(id: string) {
    const reason = window.prompt('Reason for rejection (shown to the applicant):');
    if (!reason) return;
    await apiFetch(`/merchant/admin/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) });
    load();
  }

  return (
    <main className="min-h-screen bg-ink px-6 py-10 md:px-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-display font-bold text-2xl text-paper mb-6">Merchant applications</h1>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <div className="space-y-4">
          {pending.map((application) => (
            <div key={application.id} className="bg-surface border border-white/10 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-paper font-medium">{application.user.fullName || application.user.email}</p>
                  <p className="text-xs text-muted">{application.user.email}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => approve(application.id)}
                    className="rounded-md bg-gradient-to-br from-gold to-teal px-3 py-1.5 text-ink text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => reject(application.id)}
                    className="rounded-md border border-white/15 px-3 py-1.5 text-paper text-sm font-medium"
                  >
                    Reject
                  </button>
                </div>
              </div>
              <p className="text-sm text-paper/80 bg-surfaceRaised rounded-md p-3">{application.reason}</p>
              <p className="text-[11px] text-muted mt-2">
                Applied {new Date(application.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
          {pending.length === 0 && !error && <p className="text-muted text-sm">No pending applications.</p>}
        </div>
      </div>
    </main>
  );
}
