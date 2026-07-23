'use client';

import { useEffect, useState } from 'react';

const links = [
  { href: '/marketplace', label: 'Marketplace', description: 'Browse and post buy/sell offers' },
  { href: '/trades', label: 'Trades', description: 'Track your active and past trades' },
  { href: '/wallet', label: 'Wallet', description: 'Deposit, withdraw, and view balances' },
  { href: '/notifications', label: 'Notifications', description: 'Updates on your trades and account' },
  { href: '/kyc', label: 'Verification', description: 'Complete KYC to unlock higher limits' },
  { href: '/settings/2fa', label: 'Settings', description: 'Manage two-factor authentication' },
];

export default function DashboardPage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) {
      window.location.href = '/login';
      return;
    }
    setReady(true);
  }, []);

  if (!ready) return null;

  return (
    <main className="min-h-screen bg-ink px-6 py-10 md:px-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-display font-bold text-2xl text-paper mb-8">Dashboard</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="block bg-surface border border-white/10 rounded-xl p-5 hover:border-white/25 transition-colors"
            >
              <p className="font-display font-medium text-paper">{link.label}</p>
              <p className="text-sm text-muted mt-1">{link.description}</p>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
