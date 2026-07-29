'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

type Status = {
  isMerchant: boolean;
  eligibility: {
    kycApproved: boolean;
    completedTrades: number;
    minCompletedTrades: number;
    meetsTradeMinimum: boolean;
  };
  application: {
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    reason: string;
    rejectionReason?: string | null;
    createdAt: string;
  } | null;
};

function RuleRow({ met, label }: { met: boolean; label: string }) {
  return (
    <li className={`flex items-center gap-2 text-sm ${met ? 'text-teal' : 'text-muted'}`}>
      <span>{met ? '✓' : '○'}</span>
      {label}
    </li>
  );
}

export default function ApplyMerchantPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function load() {
    apiFetch('/merchant/me').then(setStatus).catch((err) => setError(err.message));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiFetch('/merchant/apply', { method: 'POST', body: JSON.stringify({ reason }) });
      setSubmitted(true);
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!status) {
    return <main className="min-h-screen bg-ink px-6 py-10 text-muted">{error || 'Loading…'}</main>;
  }

  const eligible = status.eligibility.kycApproved && status.eligibility.meetsTradeMinimum;
  const hasPendingApplication = status.application?.status === 'PENDING';

  return (
    <main className="min-h-screen bg-ink px-6 py-10 md:px-12">
      <div className="max-w-md mx-auto bg-surface border border-white/10 rounded-2xl p-8">
        <h1 className="font-display font-bold text-2xl text-paper mb-2">Become a merchant</h1>
        <p className="text-sm text-muted mb-6">
          Merchants trade on their own ads at a 1% fee instead of 2%, and get a "Merchant" badge shown
          to other traders.
        </p>

        {status.isMerchant ? (
          <p className="text-teal text-sm bg-teal/10 border border-teal/30 rounded-md p-4">
            You're already a merchant — enjoy the 1% fee on your own ads.
          </p>
        ) : hasPendingApplication ? (
          <div className="bg-gold/10 border border-gold/30 rounded-md p-4">
            <p className="text-gold text-sm font-medium">Application under review</p>
            <p className="text-xs text-muted mt-1">
              Submitted {new Date(status.application!.createdAt).toLocaleDateString()} — we'll notify you once
              it's reviewed.
            </p>
          </div>
        ) : (
          <>
            {status.application?.status === 'REJECTED' && (
              <div className="bg-red-400/10 border border-red-400/30 rounded-md p-4 mb-4">
                <p className="text-red-400 text-sm font-medium">Your last application was rejected</p>
                {status.application.rejectionReason && (
                  <p className="text-xs text-muted mt-1">{status.application.rejectionReason}</p>
                )}
                <p className="text-xs text-muted mt-1">You're welcome to apply again below.</p>
              </div>
            )}

            <ul className="space-y-2 mb-6">
              <RuleRow met={status.eligibility.kycApproved} label="Identity verification (KYC) approved" />
              <RuleRow
                met={status.eligibility.meetsTradeMinimum}
                label={`At least ${status.eligibility.minCompletedTrades} completed trades (you have ${status.eligibility.completedTrades})`}
              />
            </ul>

            {!eligible && (
              <p className="text-xs text-muted mb-4">
                Meet the requirements above to unlock the application form.
                {!status.eligibility.kycApproved && (
                  <>
                    {' '}
                    <a href="/kyc" className="text-teal hover:underline">
                      Complete verification →
                    </a>
                  </>
                )}
              </p>
            )}

            {eligible && !submitted && (
              <form onSubmit={handleSubmit} className="space-y-3">
                <label className="block">
                  <span className="text-xs text-muted block mb-1">
                    Why do you want merchant status? (shown to the reviewing admin)
                  </span>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                    minLength={20}
                    rows={4}
                    placeholder="e.g. I plan to post ads regularly and want the lower fee…"
                    className="w-full bg-surfaceRaised rounded-md px-3 py-2 text-paper outline-none focus:ring-2 focus:ring-teal resize-none"
                  />
                </label>
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-md bg-gradient-to-br from-gold to-teal py-2 text-ink font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {loading ? 'Submitting…' : 'Submit application'}
                </button>
              </form>
            )}

            {submitted && (
              <p className="text-teal text-sm">Application submitted — we'll notify you once it's reviewed.</p>
            )}
          </>
        )}
      </div>
    </main>
  );
}
