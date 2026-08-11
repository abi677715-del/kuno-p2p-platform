'use client';

import { useEffect, useState } from 'react';
import { apiFetch, API_URL } from '@/lib/api';

export default function AdminKycPage() {
  const [pending, setPending] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  async function load() {
    try {
      const data = await apiFetch('/kyc/pending');
      setPending(data);
      setSelected(new Set());
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

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected((prev) => (prev.size === pending.length ? new Set() : new Set(pending.map((r) => r.id))));
  }

  async function bulkApprove() {
    setBulkBusy(true);
    try {
      await apiFetch('/kyc/bulk-approve', { method: 'POST', body: JSON.stringify({ ids: [...selected] }) });
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBulkBusy(false);
    }
  }

  async function bulkReject() {
    const reason = window.prompt(`Reason for rejecting ${selected.size} submissions (shown internally):`);
    if (!reason) return;
    setBulkBusy(true);
    try {
      await apiFetch('/kyc/bulk-reject', { method: 'POST', body: JSON.stringify({ ids: [...selected], reason }) });
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBulkBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-ink px-6 py-10 md:px-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h1 className="font-display font-bold text-2xl text-paper">KYC review queue</h1>
          {pending.length > 0 && (
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs text-muted">
                <input type="checkbox" checked={selected.size === pending.length} onChange={toggleSelectAll} />
                Select all
              </label>
              {selected.size > 0 && (
                <>
                  <button
                    onClick={bulkApprove}
                    disabled={bulkBusy}
                    className="rounded-md bg-gradient-to-br from-gold to-teal px-3 py-1.5 text-onaccent text-sm font-medium disabled:opacity-50"
                  >
                    Approve {selected.size}
                  </button>
                  <button
                    onClick={bulkReject}
                    disabled={bulkBusy}
                    className="rounded-md border border-white/15 px-3 py-1.5 text-paper text-sm font-medium disabled:opacity-50"
                  >
                    Reject {selected.size}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <div className="space-y-4">
          {pending.map((record) => (
            <div key={record.id} className="bg-surface border border-white/10 rounded-xl p-5 flex gap-3">
              <input
                type="checkbox"
                checked={selected.has(record.id)}
                onChange={() => toggleSelected(record.id)}
                className="mt-1.5"
              />
              <div className="flex-1">
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
                      className="rounded-md bg-gradient-to-br from-gold to-teal px-3 py-1.5 text-onaccent text-sm font-medium hover:opacity-90 transition-opacity"
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
            </div>
          ))}
          {pending.length === 0 && !error && <p className="text-muted text-sm">No pending submissions.</p>}
        </div>
      </div>
    </main>
  );
}
