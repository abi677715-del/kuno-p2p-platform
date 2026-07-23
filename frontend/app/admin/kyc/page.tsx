'use client';

import { useEffect, useState } from 'react';
import { apiFetch, API_URL } from '@/lib/api';

export default function AdminKycPage() {
  const [pending, setPending] = useState<any[]>([]);
  const [error, setError] = useState('');

  async function load() {
    try {
      const data = await apiFetch('/kyc/pending');
      setPending(data);
    } catch (err: any) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(id: string) {
    await apiFetch(`/kyc/${id}/approve`, { method: 'POST' });
    load();
  }

  async function reject(id: string) {
    const reason = window.prompt('Reason for rejection (shown internally):');
    if (!reason) return;
    await apiFetch(`/kyc/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) });
    load();
  }

  return (
    <main className="min-h-screen bg-ink px-6 py-10 md:px-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-display font-bold text-2xl text-paper mb-6">KYC review queue</h1>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <div className="space-y-4">
          {pending.map((record) => (
            <div key={record.id} className="bg-surface border border-white/10 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-paper font-medium">{record.user.email}</p>
                  <p className="text-xs text-muted">
                    {record.idType} · {record.idNumber}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => approve(record.id)}
                    className="rounded-md bg-teal px-3 py-1.5 text-ink text-sm font-medium"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => reject(record.id)}
                    className="rounded-md border border-white/15 px-3 py-1.5 text-paper text-sm font-medium"
                  >
                    Reject
                  </button>
                </div>
              </div>
              <div className="flex gap-3">
                <a href={`${API_URL}${record.documentUrl}`} target="_blank" className="text-xs text-teal underline">
                  View ID document
                </a>
                <a href={`${API_URL}${record.selfieUrl}`} target="_blank" className="text-xs text-teal underline">
                  View selfie
                </a>
              </div>
            </div>
          ))}
          {pending.length === 0 && !error && <p className="text-muted text-sm">No pending submissions.</p>}
        </div>
      </div>
    </main>
  );
}
