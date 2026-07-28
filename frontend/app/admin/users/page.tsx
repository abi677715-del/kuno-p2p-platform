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
  createdAt: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/users/admin/all').then(setUsers).catch((e) => setError(e.message));
  }, []);

  return (
    <main className="min-h-screen bg-ink px-6 py-10 md:px-12">
      <div className="max-w-4xl mx-auto">
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
