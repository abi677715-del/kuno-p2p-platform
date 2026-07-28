'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

type Profile = {
  email: string;
  fullName?: string;
  phone?: string;
  role: string;
  emailVerified: boolean;
  twoFaEnabled: boolean;
  bid?: string;
  isMerchant?: boolean;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);

  useEffect(() => {
    apiFetch('/users/me').then((data) => {
      setProfile(data);
      setFullName(data.fullName ?? '');
      setPhone(data.phone ?? '');
    });
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileError('');
    setProfileSaved(false);
    try {
      await apiFetch('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ fullName, phone }),
      });
      setProfileSaved(true);
    } catch (err: any) {
      setProfileError(err.message);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError('');
    setPasswordSaved(false);
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    try {
      await apiFetch('/users/me/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setPasswordSaved(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.message);
    }
  }

  if (!profile) return null;

  return (
    <main className="min-h-screen bg-ink px-6 py-10 md:px-12">
      <div className="max-w-xl mx-auto space-y-8">
        <h1 className="font-display font-bold text-2xl text-paper">Profile & settings</h1>

        <div className="bg-surface border border-white/10 rounded-xl p-6 space-y-4">
          <h2 className="font-display font-medium text-paper">Account</h2>
          <div className="text-sm space-y-1">
            {profile.bid && (
              <p className="text-muted">
                Your trader ID: <span className="text-gold font-mono">{profile.bid}</span>
                {profile.isMerchant && (
                  <span className="ml-2 text-[10px] font-medium px-1.5 py-0.5 rounded bg-teal/20 text-teal align-middle">
                    Merchant · 1% fee
                  </span>
                )}
              </p>
            )}
            <p className="text-muted">
              Email: <span className="text-paper">{profile.email}</span>{' '}
              <span className={profile.emailVerified ? 'text-teal' : 'text-gold'}>
                {profile.emailVerified ? '(verified)' : '(not verified)'}
              </span>
            </p>
            <p className="text-muted">
              Role: <span className="text-paper">{profile.role}</span>
            </p>
          </div>

          <form onSubmit={saveProfile} className="space-y-3">
            <Field label="Full name" value={fullName} onChange={setFullName} />
            <Field label="Phone" value={phone} onChange={setPhone} />
            {profileError && <p className="text-red-400 text-sm">{profileError}</p>}
            {profileSaved && <p className="text-teal text-sm">Profile updated.</p>}
            <button type="submit" className="rounded-md bg-gold px-4 py-2 text-ink font-medium hover:bg-gold/90 transition-colors">
              Save changes
            </button>
          </form>
        </div>

        <div className="bg-surface border border-white/10 rounded-xl p-6 space-y-4">
          <h2 className="font-display font-medium text-paper">Change password</h2>
          <form onSubmit={changePassword} className="space-y-3">
            <Field label="Current password" value={currentPassword} onChange={setCurrentPassword} type="password" />
            <Field label="New password" value={newPassword} onChange={setNewPassword} type="password" />
            <Field label="Confirm new password" value={confirmPassword} onChange={setConfirmPassword} type="password" />
            {passwordError && <p className="text-red-400 text-sm">{passwordError}</p>}
            {passwordSaved && <p className="text-teal text-sm">Password changed.</p>}
            <button type="submit" className="rounded-md bg-gold px-4 py-2 text-ink font-medium hover:bg-gold/90 transition-colors">
              Update password
            </button>
          </form>
        </div>

        {profile.bid && (
          <div className="bg-surface border border-white/10 rounded-xl p-6 space-y-3">
            <h2 className="font-display font-medium text-paper">Invite friends</h2>
            <p className="text-sm text-muted">
              Share your link — when someone signs up through it, you earn a share of the platform fee on their trades.
            </p>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={typeof window !== 'undefined' ? `${window.location.origin}/signup?ref=${profile.bid}` : ''}
                className="flex-1 bg-surfaceRaised rounded-md px-3 py-2 text-paper text-sm font-mono outline-none"
                onFocus={(e) => e.target.select()}
              />
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(`${window.location.origin}/signup?ref=${profile.bid}`);
                  setLinkCopied(true);
                  setTimeout(() => setLinkCopied(false), 2000);
                }}
                className="rounded-md bg-gold px-3 py-2 text-ink text-sm font-medium shrink-0"
              >
                {linkCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        )}

        <div className="bg-surface border border-white/10 rounded-xl p-6 space-y-3">
          <h2 className="font-display font-medium text-paper">Security & verification</h2>
          <a href="/settings/2fa" className="block text-sm text-teal hover:underline">
            Two-factor authentication {profile.twoFaEnabled ? '(enabled)' : '(not set up)'} →
          </a>
          <a href="/kyc" className="block text-sm text-teal hover:underline">
            Identity verification (KYC) →
          </a>
          <a href="/settings/relations" className="block text-sm text-teal hover:underline">
            Blocked & favorite traders →
          </a>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted block mb-1">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-surfaceRaised rounded-md px-3 py-2 text-paper outline-none focus:ring-2 focus:ring-teal"
      />
    </label>
  );
}
