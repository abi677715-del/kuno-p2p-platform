'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const params = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('Missing verification token');
      return;
    }
    apiFetch('/auth/verify-email', { method: 'POST', body: JSON.stringify({ token }) })
      .then(() => setStatus('success'))
      .catch((err) => {
        setStatus('error');
        setError(err.message);
      });
  }, [token]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-ink px-6">
      <div className="w-full max-w-sm bg-surface border border-white/10 rounded-2xl p-8 text-center">
        {status === 'checking' && <p className="text-muted">Verifying your email…</p>}
        {status === 'success' && (
          <>
            <h1 className="font-display font-bold text-xl text-teal mb-2">Email confirmed</h1>
            <p className="text-sm text-muted mb-6">Your email address has been verified.</p>
          </>
        )}
        {status === 'error' && (
          <>
            <h1 className="font-display font-bold text-xl text-red-400 mb-2">Verification failed</h1>
            <p className="text-sm text-muted mb-6">{error}</p>
          </>
        )}
        <a href="/dashboard" className="text-teal text-sm">
          Go to dashboard
        </a>
      </div>
    </main>
  );
}
