'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function TwoFaSetupPage() {
  const [step, setStep] = useState<'checking' | 'start' | 'confirm' | 'done'>('checking');
  const [secret, setSecret] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);

  useEffect(() => {
    apiFetch('/users/me')
      .then((data) => setStep(data.twoFaEnabled ? 'done' : 'start'))
      .catch(() => setStep('start'));
  }, []);

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
      const data = await apiFetch('/auth/2fa/enable', {
        method: 'POST',
        body: JSON.stringify({ secret, code }),
      });
      setBackupCodes(data.backupCodes ?? null);
      setStep('done');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function downloadBackupCodes() {
    if (!backupCodes) return;
    const blob = new Blob(
      [`Birrly 2FA backup codes\nGenerated ${new Date().toLocaleString()}\nEach code works once.\n\n${backupCodes.join('\n')}`],
      { type: 'text/plain' },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'birrly-backup-codes.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
            className="w-full rounded-md bg-gradient-to-br from-gold to-teal px-4 py-3 text-onaccent font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {loading ? 'Generating…' : 'Set up 2FA'}
          </button>
        )}

        {step === 'confirm' && (
          <form onSubmit={confirmSetup}>
            <div className="bg-[#fff] rounded-lg p-4 mb-4 flex justify-center">
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
              className="w-full rounded-md bg-gradient-to-br from-gold to-teal px-4 py-3 text-onaccent font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {loading ? 'Confirming…' : 'Confirm and enable'}
            </button>
          </form>
        )}

        {step === 'done' && (
          <div>
            <p className="text-teal text-sm mb-4">
              2FA is enabled. You'll be asked for a code the next time you log in.
            </p>
            {backupCodes && (
              <div className="bg-surfaceRaised border border-gold/30 rounded-lg p-4">
                <p className="text-sm text-gold font-medium mb-1">Save your backup codes</p>
                <p className="text-xs text-muted mb-3">
                  If you lose access to your authenticator app, each of these codes can be used once
                  instead, to log back in. They won't be shown again — save them somewhere safe.
                </p>
                <div className="grid grid-cols-2 gap-2 font-mono text-sm text-paper mb-3">
                  {backupCodes.map((c) => (
                    <span key={c} className="bg-surface rounded px-2 py-1 text-center">
                      {c}
                    </span>
                  ))}
                </div>
                <button
                  onClick={downloadBackupCodes}
                  className="text-xs text-teal hover:underline"
                >
                  Download as a text file
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      {step === 'done' && <RegenerateBackupCodes />}
    </main>
  );
}

function RegenerateBackupCodes() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [codes, setCodes] = useState<string[] | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegenerate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiFetch('/auth/2fa/backup-codes/regenerate', {
        method: 'POST',
        body: JSON.stringify({ code }),
      });
      setCodes(data.backupCodes ?? null);
      setCode('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <div className="w-full max-w-sm mt-4">
        <button onClick={() => setOpen(true)} className="text-xs text-muted hover:text-paper underline">
          Lost your backup codes? Generate new ones
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm bg-surface border border-white/10 rounded-2xl p-6 mt-4">
      <p className="text-sm text-paper mb-1">Regenerate backup codes</p>
      <p className="text-xs text-muted mb-3">
        This invalidates any codes you already have. Enter a current code from your authenticator app to confirm.
      </p>
      {!codes ? (
        <form onSubmit={handleRegenerate}>
          <input
            inputMode="numeric"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="000000"
            className="w-full bg-surfaceRaised rounded-md px-3 py-2 text-paper mb-3 outline-none focus:ring-2 focus:ring-teal font-mono text-center tracking-widest"
          />
          {error && <p className="text-xs text-red-400 mb-3">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-gradient-to-br from-gold to-teal px-4 py-2 text-onaccent text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {loading ? 'Generating…' : 'Regenerate codes'}
          </button>
        </form>
      ) : (
        <div className="grid grid-cols-2 gap-2 font-mono text-sm text-paper">
          {codes.map((c) => (
            <span key={c} className="bg-surfaceRaised rounded px-2 py-1 text-center">
              {c}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
