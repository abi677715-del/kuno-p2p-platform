'use client';

import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

const links = [
  { href: '/marketplace', label: 'Marketplace', description: 'Browse and post buy/sell offers' },
  { href: '/trades', label: 'Trades', description: 'Track your active and past trades' },
  { href: '/wallet', label: 'Wallet', description: 'Deposit, withdraw, and view balances' },
  { href: '/notifications', label: 'Notifications', description: 'Updates on your trades and account' },
  { href: '/kyc', label: 'Verification', description: 'Complete KYC to unlock higher limits' },
  { href: '/profile', label: 'Profile & Settings', description: 'Edit your info, password, and security' },
  { href: '/support', label: 'Support', description: 'FAQs and help requests' },
];

const adminLinks = [
  { href: '/admin/disputes', label: 'Dispute resolution', description: 'Review trade chats and resolve disputes' },
  { href: '/admin/kyc', label: 'KYC review', description: 'Approve or reject identity verification' },
  { href: '/admin/wallet', label: 'Deposits & withdrawals', description: 'Confirm pending on-chain transactions' },
  { href: '/admin/revenue', label: 'Revenue', description: 'Platform commission collected' },
  { href: '/admin/support', label: 'Support tickets', description: 'Respond to user help requests' },
];

function getRole(): string | null {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split('.')[1])).role ?? null;
  } catch {
    return null;
  }
}

type Profile = { fullName?: string; email?: string; phone?: string };

export default function DashboardPage() {
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    setIsAdmin(getRole() === 'ADMIN');
    setReady(true);

    fetch(`${API_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setProfile(data))
      .catch(() => {});
  }, []);

  if (!ready) return null;

  function logout() {
    localStorage.removeItem('accessToken');
    window.location.href = '/login';
  }

  return (
    <main className="min-h-screen bg-ink px-6 py-10 md:px-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <h1 className="font-display font-bold text-2xl text-paper">Dashboard</h1>
          <button
            onClick={logout}
            className="rounded-md border border-white/15 px-4 py-2 text-sm text-paper font-medium hover:border-white/30 transition-colors"
          >
            Log out
          </button>
        </div>

        {profile && (
          <a href="/profile" className="block mb-8 text-sm text-muted hover:text-paper transition-colors w-fit">
            <p className="text-paper font-medium">{profile.fullName || profile.email}</p>
            {profile.phone && <p>{profile.phone}</p>}
            <p>{profile.email}</p>
          </a>
        )}

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

        {isAdmin && (
          <div className="mt-10">
            <h2 className="font-display font-bold text-lg text-gold mb-4">Admin</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {adminLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="block bg-surface border border-gold/30 rounded-xl p-5 hover:border-gold/60 transition-colors"
                >
                  <p className="font-display font-medium text-paper">{link.label}</p>
                  <p className="text-sm text-muted mt-1">{link.description}</p>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
