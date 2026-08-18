'use client';

import { useEffect, useState } from 'react';
import { apiFetch, API_URL } from '@/lib/api';

type PendingAd = {
  id: string;
  advertiserName: string;
  advertiserEmail: string;
  title: string;
  linkUrl: string;
  videoUrl: string;
  placements: string[];
  createdAt: string;
};

export default function AdminBannerAdsPage() {
  const [pending, setPending] = useState<PendingAd[]>([]);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    try {
      const data = await apiFetch('/banner-ads/pending');
      setPending(data);
    } catch (err: any) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(id: string) {
    setBusyId(id);
    try {
      await apiFetch(`/banner-ads/${id}/approve`, { method: 'POST' });
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function reject(id: string) {
    const reason = window.prompt('Reason for rejection (shown internally):');
    if (!reason) return;
    setBusyId(id);
    try {
      await apiFetch(`/banner-ads/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) });
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="min-h-screen bg-ink px-6 py-10 md:px-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-display font-bold text-2xl text-paper mb-6">Sponsored video ads — review queue</h1>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <div className="space-y-4">
          {pending.map((ad) => (
            <div key={ad.id} className="bg-surface border border-white/10 rounded-xl p-5 flex gap-4 flex-wrap">
              <video
                src={`${API_URL}${ad.videoUrl}`}
                controls
                muted
                className="w-56 h-32 rounded-lg bg-black object-cover shrink-0"
              />
              <div className="flex-1 min-w-[200px]">
                <p className="text-paper font-medium">{ad.title}</p>
                <p className="text-xs text-muted">
                  {ad.advertiserName} · {ad.advertiserEmail}
                </p>
                <p className="text-xs text-muted mt-1 break-all">
                  Links to: <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer" className="text-teal underline">{ad.linkUrl}</a>
                </p>
                <p className="text-xs text-muted mt-1">Placements: {ad.placements.join(', ')}</p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => approve(ad.id)}
                    disabled={busyId === ad.id}
                    className="rounded-md bg-gradient-to-br from-gold to-teal px-3 py-1.5 text-onaccent text-sm font-medium disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => reject(ad.id)}
                    disabled={busyId === ad.id}
                    className="rounded-md border border-white/15 px-3 py-1.5 text-paper text-sm font-medium disabled:opacity-50"
                  >
                    Reject
                  </button>
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
