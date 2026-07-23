'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function TwoFaSetupPage() {
  const [step, setStep] = useState<'start' | 'confirm' | 'done'>('start');
  const [secret, setSecret] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function startSetup() {
    setError('');
    setLoading(true);
    try {
      const data = await apiFetch('/auth/2fa/setup', { method: 'POST' });
      setSecret(data.secret);
      setQrCodeDataUrl(data.qrCodeDataUrl);
      setStep('confirm');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function confirmSetup(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiFetch('/auth/2fa/enable', {
        method: 'POST',
        body: JSON.stringify({ secret, code }),
      });
      setStep('done');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-ink px-6 py-10 flex items-center justify-center">
      <div className="w-full max-w-sm bg-surface border border-white/10 rounded-2xl p-8">
        <h1 className="font-display font-bold text-2xl text-paper mb-2">Two-factor authentication</h1>
        <p className="text-sm text-muted mb-6">
          Protect withdrawals and logins with a code from Google Authenticator or a compatible app.
        </p>

        {step === 'start' && (
          <button
            onClick={startSetup}
            disabled={loading}
            className="w-full rounded-md bg-gold px-4 py-3 text-ink font-medium hover:bg-gold/90 transition-colors disabled:opacity-60"
          >
            {loading ? 'Generating…' : 'Set up 2FA'}
          </button>
        )}

        {step === 'confirm' && (
          <form onSubmit={confirmSetup}>
            <div className="bg-white rounded-lg p-4 mb-4 flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrCodeDataUrl} alt="Scan this QR code in your authenticator app" width={200} height={200} />
            </div>
            <p className="text-xs text-muted mb-4 text-center break-all">
              Can't scan it? Enter this key manually: <span className="font-mono text-paper">{secret}</span>
            </p>
            <label className="text-sm text-muted block mb-1">Enter the 6-digit code</label>
            <input
              inputMode="numeric"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full bg-surfaceRaised rounded-md px-3 py-2 text-paper mb-4 outline-none focus:ring-2 focus:ring-teal font-mono text-center text-xl tracking-widest"
              placeholder="000000"
            />
            {error && <p className="text-sm text-red-400 mb-4">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-gold px-4 py-3 text-ink font-medium hover:bg-gold/90 transition-colors disabled:opacity-60"
            >
              {loading ? 'Confirming…' : 'Confirm and enable'}
            </button>
          </form>
        )}

        {step === 'done' && (
          <p className="text-teal text-sm">
            2FA is enabled. You'll be asked for a code the next time you log in.
          </p>
        )}
      </div>
    </main>
  );
}
