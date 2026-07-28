'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

type Relation = {
  id: string;
  type: 'BLOCK' | 'FAVORITE';
  targetUser: { id: string; bid: string; fullName?: string; email: string };
};

export default function RelationsPage() {
  const [relations, setRelations] = useState<Relation[]>([]);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    try {
      setRelations(await apiFetch('/relations/mine'));
    } catch (err: any) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(r: Relation) {
    setBusyId(r.id);
    setError('');
    try {
      await apiFetch(`/relations/${r.targetUser.id}/${r.type === 'BLOCK' ? 'block' : 'favorite'}`, { method: 'DELETE' });
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  const blocked = relations.filter((r) => r.type === 'BLOCK');
  const favorited = relations.filter((r) => r.type === 'FAVORITE');

  return (
    <main className="min-h-screen bg-ink px-6 py-10 md:px-12">
      <div className="max-w-xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="font-display font-bold text-2xl text-paper">Blocked & favorite traders</h1>
          <a href="/profile" className="text-sm text-teal hover:underline">
            Back to profile
          </a>
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="bg-surface border border-white/10 rounded-xl p-6 space-y-3">
          <h2 className="font-display font-medium text-paper">Favorites</h2>
          <p className="text-xs text-muted">Traders you've marked as reliable — favorite them from an ad or trade page.</p>
          <div className="space-y-2">
            {favorited.map((r) => (
              <div key={r.id} className="flex items-center justify-between bg-surfaceRaised rounded-md px-3 py-2">
                <div>
                  <p className="text-sm text-paper">{r.targetUser.fullName || r.targetUser.email}</p>
                  <p className="text-xs text-gold font-mono">{r.targetUser.bid}</p>
                </div>
                <button
                  onClick={() => remove(r)}
                  disabled={busyId === r.id}
                  className="text-xs text-muted hover:text-red-400 disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            ))}
            {favorited.length === 0 && <p className="text-sm text-muted">No favorites yet.</p>}
          </div>
        </div>

        <div className="bg-surface border border-white/10 rounded-xl p-6 space-y-3">
          <h2 className="font-display font-medium text-paper">Blocked</h2>
          <p className="text-xs text-muted">Blocked traders can't open a new trade with you in either direction.</p>
          <div className="space-y-2">
            {blocked.map((r) => (
              <div key={r.id} className="flex items-center justify-between bg-surfaceRaised rounded-md px-3 py-2">
                <div>
                  <p className="text-sm text-paper">{r.targetUser.fullName || r.targetUser.email}</p>
                  <p className="text-xs text-gold font-mono">{r.targetUser.bid}</p>
                </div>
                <button
                  onClick={() => remove(r)}
                  disabled={busyId === r.id}
                  className="text-xs text-teal hover:underline disabled:opacity-50"
                >
                  Unblock
                </button>
              </div>
            ))}
            {blocked.length === 0 && <p className="text-sm text-muted">No one blocked.</p>}
          </div>
        </div>
      </div>
    </main>
  );
}
