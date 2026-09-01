'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useLanguage } from '@/lib/i18n/context';
import LanguageToggle from '@/components/LanguageToggle';

export default function LoginPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [preAuthToken, setPreAuthToken] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loggedOutNotice, setLoggedOutNotice] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('loggedOutReason') === 'inactivity') {
      sessionStorage.removeItem('loggedOutReason');
      setLoggedOutNotice(true);
    }
  }, []);

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
      <div className="w-full max-w-sm">
        <div className="flex justify-end mb-3">
          <LanguageToggle />
        </div>
        <div className="bg-surface border border-white/10 rounded-2xl p-8">
        {!preAuthToken ? (
          <form onSubmit={handleLogin}>
            <h1 className="font-display font-bold text-2xl text-paper mb-6">{t.login.title}</h1>

            {loggedOutNotice && (
              <p className="text-sm text-gold mb-4">{t.login.loggedOutNotice}</p>
            )}

            <label className="text-sm text-muted block mb-1">{t.login.email}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surfaceRaised rounded-md px-3 py-2 text-paper mb-4 outline-none focus:ring-2 focus:ring-teal"
            />

            <div className="flex items-center justify-between mb-1">
              <label className="text-sm text-muted">{t.login.password}</label>
              <a href="/forgot-password" className="text-xs text-teal">
                {t.login.forgotPassword}
              </a>
            </div>
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
              className="w-full rounded-md bg-gradient-to-br from-gold to-teal px-4 py-3 text-onaccent font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {loading ? t.login.submitting : t.login.submit}
            </button>

            <p className="text-sm text-muted mt-4 text-center">
              {t.login.noAccount} <a href="/signup" className="text-teal">{t.login.signUp}</a>
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerify}>
            <h1 className="font-display font-bold text-2xl text-paper mb-2">
              {useBackupCode ? 'Enter a backup code' : t.login.codeTitle}
            </h1>
            <p className="text-sm text-muted mb-6">
              {useBackupCode
                ? 'Enter one of the backup codes you saved when you set up 2FA.'
                : t.login.codeSubtitle}
            </p>

            <input
              inputMode={useBackupCode ? 'text' : 'numeric'}
              maxLength={useBackupCode ? 9 : 6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full bg-surfaceRaised rounded-md px-3 py-2 text-paper mb-3 outline-none focus:ring-2 focus:ring-teal font-mono text-center text-xl tracking-widest"
              placeholder={useBackupCode ? 'A1B2-C3D4' : '000000'}
            />

            <button
              type="button"
              onClick={() => {
                setUseBackupCode((v) => !v);
                setCode('');
                setError('');
              }}
              className="block text-xs text-teal hover:underline mb-6"
            >
              {useBackupCode ? 'Use your authenticator app instead' : 'Use a backup code instead'}
            </button>

            {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-gradient-to-br from-gold to-teal px-4 py-3 text-onaccent font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {loading ? t.login.verifying : t.login.verify}
            </button>
          </form>
        )}
        </div>
      </div>
    </main>
  );
}
