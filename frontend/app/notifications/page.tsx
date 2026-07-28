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

  async function remove(id: string) {
    await apiFetch(`/notifications/${id}`, { method: 'DELETE' });
    load();
  }

  async function clearAll() {
    if (!window.confirm('Delete all notifications? This cannot be undone.')) return;
    await apiFetch('/notifications', { method: 'DELETE' });
    load();
  }

  return (
    <main className="min-h-screen bg-ink px-6 py-10 md:px-12">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display font-bold text-2xl text-paper">Notifications</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => apiFetch('/notifications/read-all', { method: 'POST' }).then(load)}
              className="text-xs text-teal"
            >
              Mark all read
            </button>
            {items.length > 0 && (
              <button onClick={clearAll} className="text-xs text-red-400">
                Clear all
              </button>
            )}
          </div>
        </div>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        <div className="space-y-2">
          {items.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-2 bg-surface border rounded-lg px-4 py-3 ${
                n.readAt ? 'border-white/5 opacity-60' : 'border-white/15'
              }`}
            >
              <button onClick={() => markRead(n.id)} className="flex-1 text-left">
                <p className="text-sm text-paper">{n.payload?.message ?? n.type}</p>
                <p className="text-xs text-muted mt-1">{new Date(n.createdAt).toLocaleString()}</p>
              </button>
              <button
                onClick={() => remove(n.id)}
                className="text-xs text-muted hover:text-red-400 shrink-0"
                title="Delete"
              >
                ✕
              </button>
            </div>
          ))}
          {items.length === 0 && !error && <p className="text-muted text-sm">No notifications yet.</p>}
        </div>
      </div>
    </main>
  );
}
