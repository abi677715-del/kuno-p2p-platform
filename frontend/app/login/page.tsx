'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [preAuthToken, setPreAuthToken] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (data.requiresTwoFa) {
        setPreAuthToken(data.preAuthToken);
      } else {
        localStorage.setItem('accessToken', data.accessToken);
        window.location.href = '/dashboard';
      }
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiFetch('/auth/2fa/verify-login', {
        method: 'POST',
        body: JSON.stringify({ preAuthToken, code }),
      });
      localStorage.setItem('accessToken', data.accessToken);
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-ink px-6">
      <div className="w-full max-w-sm bg-surface border border-white/10 rounded-2xl p-8">
        {!preAuthToken ? (
          <form onSubmit={handleLogin}>
            <h1 className="font-display font-bold text-2xl text-paper mb-6">Log in</h1>

            <label className="text-sm text-muted block mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surfaceRaised rounded-md px-3 py-2 text-paper mb-4 outline-none focus:ring-2 focus:ring-teal"
            />

            <label className="text-sm text-muted block mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surfaceRaised rounded-md px-3 py-2 text-paper mb-6 outline-none focus:ring-2 focus:ring-teal"
            />

            {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-gold px-4 py-3 text-ink font-medium hover:bg-gold/90 transition-colors disabled:opacity-60"
            >
              {loading ? 'Logging in…' : 'Log in'}
            </button>

            <p className="text-sm text-muted mt-4 text-center">
              No account yet? <a href="/signup" className="text-teal">Sign up</a>
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerify}>
            <h1 className="font-display font-bold text-2xl text-paper mb-2">Enter your code</h1>
            <p className="text-sm text-muted mb-6">Open your authenticator app and enter the 6-digit code.</p>

            <input
              inputMode="numeric"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full bg-surfaceRaised rounded-md px-3 py-2 text-paper mb-6 outline-none focus:ring-2 focus:ring-teal font-mono text-center text-xl tracking-widest"
              placeholder="000000"
            />

            {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-gold px-4 py-3 text-ink font-medium hover:bg-gold/90 transition-colors disabled:opacity-60"
            >
              {loading ? 'Verifying…' : 'Verify and log in'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
