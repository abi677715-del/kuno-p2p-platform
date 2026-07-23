'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function NotificationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState('');

  async function load() {
    try {
      setItems(await apiFetch('/notifications'));
    } catch (err: any) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function markRead(id: string) {
    await apiFetch(`/notifications/${id}/read`, { method: 'POST' });
    load();
  }

  return (
    <main className="min-h-screen bg-ink px-6 py-10 md:px-12">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display font-bold text-2xl text-paper">Notifications</h1>
          <button
            onClick={() => apiFetch('/notifications/read-all', { method: 'POST' }).then(load)}
            className="text-xs text-teal"
          >
            Mark all read
          </button>
        </div>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        <div className="space-y-2">
          {items.map((n) => (
            <button
              key={n.id}
              onClick={() => markRead(n.id)}
              className={`w-full text-left bg-surface border rounded-lg px-4 py-3 ${
                n.readAt ? 'border-white/5 opacity-60' : 'border-white/15'
              }`}
            >
              <p className="text-sm text-paper">{n.payload?.message ?? n.type}</p>
              <p className="text-xs text-muted mt-1">{new Date(n.createdAt).toLocaleString()}</p>
            </button>
          ))}
          {items.length === 0 && !error && <p className="text-muted text-sm">No notifications yet.</p>}
        </div>
      </div>
    </main>
  );
}
