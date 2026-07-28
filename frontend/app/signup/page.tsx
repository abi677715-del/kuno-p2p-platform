'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupContent />
    </Suspense>
  );
}

function SignupContent() {
  const params = useSearchParams();
  const ref = params.get('ref');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, phone, password, ref: ref || undefined }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? 'Signup failed');
      }
      const data = await res.json();
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
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-surface border border-white/10 rounded-2xl p-8">
        <h1 className="font-display font-bold text-2xl text-paper mb-2">Create your account</h1>
        {ref && (
          <p className="text-xs text-teal mb-4">
            Invited by trader <span className="font-mono">{ref.toUpperCase()}</span>
          </p>
        )}

        <label className="text-sm text-muted block mb-1">Full name</label>
        <input
          type="text"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full bg-surfaceRaised rounded-md px-3 py-2 text-paper mb-4 outline-none focus:ring-2 focus:ring-teal"
        />

        <label className="text-sm text-muted block mb-1">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-surfaceRaised rounded-md px-3 py-2 text-paper mb-4 outline-none focus:ring-2 focus:ring-teal"
        />

        <label className="text-sm text-muted block mb-1">Phone</label>
        <input
          type="tel"
          required
          placeholder="+2519xxxxxxxx"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full bg-surfaceRaised rounded-md px-3 py-2 text-paper mb-4 outline-none focus:ring-2 focus:ring-teal"
        />

        <label className="text-sm text-muted block mb-1">Password</label>
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-surfaceRaised rounded-md px-3 py-2 text-paper mb-6 outline-none focus:ring-2 focus:ring-teal"
        />

        {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-gradient-to-br from-gold to-teal px-4 py-3 text-ink font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>

        <p className="text-sm text-muted mt-4 text-center">
          Already have an account? <a href="/login" className="text-teal">Log in</a>
        </p>
      </form>
    </main>
  );
}
