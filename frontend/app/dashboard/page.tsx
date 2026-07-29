'use client';

import { useEffect, useRef, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

const links = [
  { href: '/marketplace', label: 'Marketplace', description: 'Browse and post buy/sell offers' },
  { href: '/trades', label: 'Trades', description: 'Track your active and past trades' },
  { href: '/wallet', label: 'Wallet', description: 'Deposit, withdraw, and view balances' },
  { href: '/notifications', label: 'Notifications', description: 'Updates on your trades and account' },
  { href: '/kyc', label: 'Verification', description: 'Complete KYC to unlock higher limits' },
  { href: '/merchant/apply', label: 'Become a merchant', description: 'Apply for 1% fees and a merchant badge' },
  { href: '/profile', label: 'Profile & Settings', description: 'Edit your info, password, and security' },
  { href: '/support', label: 'Support', description: 'FAQs and help requests' },
];

const adminLinks = [
  { href: '/admin', label: 'Overview', description: 'At-a-glance counts of everything waiting on you' },
  { href: '/admin/disputes', label: 'Dispute resolution', description: 'Review trade chats and resolve disputes' },
  { href: '/admin/kyc', label: 'KYC review', description: 'Approve or reject identity verification' },
  { href: '/admin/wallet', label: 'Deposits & withdrawals', description: 'Confirm pending on-chain transactions' },
  { href: '/admin/revenue', label: 'Revenue', description: 'Platform commission collected' },
  { href: '/admin/support', label: 'Support tickets', description: 'Respond to user help requests' },
  { href: '/admin/audit-log', label: 'Audit log', description: 'Record of sensitive admin actions' },
  { href: '/admin/users', label: 'Users', description: 'List of all registered users and their trader ID' },
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

type Profile = { fullName?: string; email?: string; phone?: string; avatar?: string };

function resizeImage(file: File, maxSize = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function DashboardPage() {
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  function loadProfile() {
    fetch(`${API_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setProfile(data))
      .catch(() => {});
  }

  useEffect(() => {
    if (!token) {
      window.location.href = '/login';
      return;
    }
    setIsAdmin(getRole() === 'ADMIN');
    setReady(true);
    loadProfile();
  }, []);

  if (!ready) return null;

  function logout() {
    localStorage.removeItem('accessToken');
    window.location.href = '/login';
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError('');
    try {
      const dataUrl = await resizeImage(file);
      const res = await fetch(`${API_URL}/users/me/avatar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ avatar: dataUrl }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? 'Failed to upload photo');
      }
      loadProfile();
    } catch (err: any) {
      setAvatarError(err.message ?? 'Failed to upload photo');
    }
  }

  const initial = (profile?.fullName || profile?.email || '?').trim().charAt(0).toUpperCase();

  return (
    <main className="min-h-screen bg-ink px-6 py-10 md:px-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display font-bold text-2xl text-paper">Dashboard</h1>

          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
                            className="h-10 w-10 rounded-full overflow-hidden border border-white/15 bg-gradient-to-br from-gold to-teal flex items-center justify-center text-ink font-bold hover:border-white/30 transition-colors"
            >
              {profile?.avatar ? (
                <img src={profile.avatar} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                initial
              )}
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-surface border border-white/10 rounded-xl shadow-lg py-2 z-10">
                <div className="px-4 py-2 border-b border-white/10">
                  <p className="text-sm text-paper font-medium truncate">{profile?.fullName || profile?.email}</p>
                  <p className="text-xs text-muted truncate">{profile?.email}</p>
                </div>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full text-left px-4 py-2 text-sm text-paper hover:bg-surfaceRaised transition-colors"
                >
                  Change profile photo
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />

                <a href="/profile" className="block px-4 py-2 text-sm text-paper hover:bg-surfaceRaised transition-colors">
                  Profile
                </a>
                <a href="/settings/2fa" className="block px-4 py-2 text-sm text-paper hover:bg-surfaceRaised transition-colors">
                  Security (2FA)
                </a>
                <a href="/kyc" className="block px-4 py-2 text-sm text-paper hover:bg-surfaceRaised transition-colors">
                  Verification (KYC)
                </a>
                <a href="/support" className="block px-4 py-2 text-sm text-paper hover:bg-surfaceRaised transition-colors">
                  Support
                </a>

                <div className="border-t border-white/10 mt-1 pt-1">
                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-surfaceRaised transition-colors"
                  >
                    Log out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {avatarError && <p className="text-red-400 text-sm mb-4">{avatarError}</p>}

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
