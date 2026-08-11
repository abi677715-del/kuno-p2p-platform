'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

type UserRow = {
  id: string;
  bid: string;
  email: string;
  fullName?: string;
  role: string;
  status: string;
  emailVerified: boolean;
  isMerchant: boolean;
  createdAt: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    apiFetch('/users/admin/all').then(setUsers).catch((e) => setError(e.message));
  }, []);

  async function toggleMerchant(u: UserRow) {
    setBusyId(u.id);
    setError('');
    try {
      await apiFetch(`/users/admin/${u.id}/merchant`, {
        method: 'PATCH',
        body: JSON.stringify({ isMerchant: !u.isMerchant }),
      });
      setUsers((prev) => prev.map((row) => (row.id === u.id ? { ...row, isMerchant: !u.isMerchant } : row)));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function toggleSupport(u: UserRow) {
    if (u.role === 'ADMIN') return;
    const nextRole = u.role === 'SUPPORT' ? 'USER' : 'SUPPORT';
    setBusyId(u.id);
    setError('');
    try {
      await apiFetch(`/users/admin/${u.id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: nextRole }),
      });
      setUsers((prev) => prev.map((row) => (row.id === u.id ? { ...row, role: nextRole } : row)));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="min-h-screen bg-ink px-6 py-10 md:px-12">
      <div className="max-w-5xl mx-auto">
        <h1 className="font-display font-bold text-2xl text-paper mb-6">Users</h1>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        <div className="bg-surface border border-white/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted border-b border-white/10">
                  <th className="px-4 py-3 font-medium">Trader ID</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Merchant</th>
                  <th className="px-4 py-3 font-medium">Support staff</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-white/5">
                    <td className="px-4 py-3 font-mono text-gold">{u.bid}</td>
                    <td className="px-4 py-3 text-paper">{u.fullName || '—'}</td>
                    <td className="px-4 py-3 text-muted">{u.email}</td>
                    <td className="px-4 py-3 text-muted">{u.role}</td>
                    <td className="px-4 py-3 text-muted">{u.status}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleMerchant(u)}
                        disabled={busyId === u.id}
                        className={`text-xs font-medium px-2 py-1 rounded disabled:opacity-50 ${
                          u.isMerchant ? 'bg-gradient-to-br from-gold to-teal text-onaccent' : 'bg-white/10 text-muted'
                        }`}
                        title="Merchants trade on their own ads at a 1% fee instead of 2%"
                      >
                        {u.isMerchant ? 'Merchant · 1% fee' : 'Make merchant'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      {u.role === 'ADMIN' ? (
                        <span className="text-xs text-muted">—</span>
                      ) : (
                        <button
                          onClick={() => toggleSupport(u)}
                          disabled={busyId === u.id}
                          className={`text-xs font-medium px-2 py-1 rounded disabled:opacity-50 ${
                            u.role === 'SUPPORT' ? 'bg-gradient-to-br from-gold to-teal text-onaccent' : 'bg-white/10 text-muted'
                          }`}
                          title="Support staff can handle support tickets only — no wallet, KYC, dispute, or user-management access"
                        >
                          {u.role === 'SUPPORT' ? 'Support staff' : 'Make support'}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {users.length === 0 && !error && <p className="text-muted text-sm p-4">No users yet.</p>}
        </div>
      </div>
    </main>
  );
}
