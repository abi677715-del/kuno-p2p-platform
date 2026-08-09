'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { DailyChart } from '@/components/DailyChart';

type DailyStat = { date: string; volumeUsdt: number; feeRevenueUsdt: number; tradesCompleted: number; disputesOpened: number };

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
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/admin/summary').then(setSummary).catch((e) => setError(e.message));
    apiFetch('/admin/summary/daily-stats?days=30').then(setDailyStats).catch(() => {});
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

        {dailyStats.length > 0 && (
          <div className="mt-10">
            <h2 className="font-display font-medium text-paper mb-4">Last 30 days</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DailyChart
                title="Trade volume (USDT)"
                points={dailyStats.map((d) => ({ date: d.date, value: d.volumeUsdt }))}
                color="#0B8457"
                formatValue={(v) => `${v.toLocaleString()} USDT`}
              />
              <DailyChart
                title="Platform fee revenue (USDT)"
                points={dailyStats.map((d) => ({ date: d.date, value: d.feeRevenueUsdt }))}
                color="#E8A33D"
                formatValue={(v) => `${v.toLocaleString()} USDT`}
              />
              <DailyChart
                title="Trades completed"
                points={dailyStats.map((d) => ({ date: d.date, value: d.tradesCompleted }))}
                color="#0B8457"
              />
              <DailyChart
                title="Disputes opened"
                points={dailyStats.map((d) => ({ date: d.date, value: d.disputesOpened }))}
                color="#f87171"
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
