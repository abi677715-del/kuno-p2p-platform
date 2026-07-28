'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const params = useSearchParams();
  const token = params.get('token');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!token) {
      setError('Missing or invalid reset link');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword }),
      });
      setDone(true);
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-ink px-6">
      <div className="w-full max-w-sm bg-surface border border-white/10 rounded-2xl p-8">
        {done ? (
          <>
            <h1 className="font-display font-bold text-xl text-teal mb-2">Password updated</h1>
            <p className="text-sm text-muted mb-6">You can now log in with your new password.</p>
            <a href="/login" className="text-teal text-sm">
              Go to log in
            </a>
          </>
        ) : !token ? (
          <>
            <h1 className="font-display font-bold text-xl text-red-400 mb-2">Invalid link</h1>
            <p className="text-sm text-muted mb-6">
              This reset link is missing its token. Request a new one from the forgot password page.
            </p>
            <a href="/forgot-password" className="text-teal text-sm">
              Request a new link
            </a>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <h1 className="font-display font-bold text-2xl text-paper mb-6">Reset your password</h1>

            <label className="text-sm text-muted block mb-1">New password</label>
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-surfaceRaised rounded-md px-3 py-2 text-paper mb-4 outline-none focus:ring-2 focus:ring-teal"
            />

            <label className="text-sm text-muted block mb-1">Confirm new password</label>
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-surfaceRaised rounded-md px-3 py-2 text-paper mb-6 outline-none focus:ring-2 focus:ring-teal"
            />

            {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-gold px-4 py-3 text-ink font-medium hover:bg-gold/90 transition-colors disabled:opacity-60"
            >
              {loading ? 'Updating…' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
