'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

type Summary = {
  openDisputes: number;
  pendingKyc: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  openSupportTickets: number;
  totalUsers: number;
  totalMerchants: number;
};

const CARDS: { key: keyof Summary; label: string; href: string; urgent?: boolean }[] = [
  { key: 'openDisputes', label: 'Open disputes', href: '/admin/disputes', urgent: true },
  { key: 'pendingKyc', label: 'Pending KYC reviews', href: '/admin/kyc', urgent: true },
  { key: 'pendingDeposits', label: 'Pending deposits', href: '/admin/wallet', urgent: true },
  { key: 'pendingWithdrawals', label: 'Pending withdrawals', href: '/admin/wallet', urgent: true },
  { key: 'openSupportTickets', label: 'Open support tickets', href: '/admin/support', urgent: true },
  { key: 'totalUsers', label: 'Total users', href: '/admin/users' },
  { key: 'totalMerchants', label: 'Merchants', href: '/admin/users' },
];

export default function AdminOverviewPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/admin/summary').then(setSummary).catch((e) => setError(e.message));
  }, []);

  return (
    <main className="min-h-screen bg-ink px-6 py-10 md:px-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-display font-bold text-2xl text-paper mb-6">Admin overview</h1>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {CARDS.map((card) => {
            const value = summary?.[card.key];
            const needsAttention = card.urgent && typeof value === 'number' && value > 0;
            return (
              <a
                key={card.key}
                href={card.href}
                className={`block bg-surface border rounded-xl p-5 hover:border-white/25 transition-colors ${
                  needsAttention ? 'border-gold/40' : 'border-white/10'
                }`}
              >
                <p className={`font-mono text-3xl ${needsAttention ? 'text-gold' : 'text-paper'}`}>
                  {value ?? '—'}
                </p>
                <p className="text-sm text-muted mt-1">{card.label}</p>
              </a>
            );
          })}
        </div>
      </div>
    </main>
  );
}
