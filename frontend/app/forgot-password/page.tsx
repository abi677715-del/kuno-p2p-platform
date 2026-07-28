'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-ink px-6">
      <div className="w-full max-w-sm bg-surface border border-white/10 rounded-2xl p-8">
        {sent ? (
          <>
            <h1 className="font-display font-bold text-xl text-teal mb-2">Check your email</h1>
            <p className="text-sm text-muted mb-6">
              If an account exists for {email}, we've sent a link to reset your password. It expires in 1 hour.
            </p>
            <a href="/login" className="text-teal text-sm">
              Back to log in
            </a>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <h1 className="font-display font-bold text-2xl text-paper mb-2">Forgot password</h1>
            <p className="text-sm text-muted mb-6">
              Enter your account email and we'll send you a link to reset your password.
            </p>

            <label className="text-sm text-muted block mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surfaceRaised rounded-md px-3 py-2 text-paper mb-6 outline-none focus:ring-2 focus:ring-teal"
            />

            {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-gold px-4 py-3 text-ink font-medium hover:bg-gold/90 transition-colors disabled:opacity-60"
            >
              {loading ? 'Sending…' : 'Send reset link'}
            </button>

            <p className="text-sm text-muted mt-4 text-center">
              Remembered it? <a href="/login" className="text-teal">Log in</a>
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
