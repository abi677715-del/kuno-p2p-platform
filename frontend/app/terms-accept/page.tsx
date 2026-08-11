'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function TermsAcceptPage() {
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) {
      window.location.href = '/login';
      return;
    }
    apiFetch('/users/me')
      .then((data) => {
        if (data.termsAccepted) window.location.href = '/dashboard';
      })
      .catch(() => {});
  }, []);

  async function handleContinue() {
    setError('');
    setSubmitting(true);
    try {
      await apiFetch('/users/me/accept-terms', { method: 'POST' });
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-ink px-6 py-10 md:px-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-display font-bold text-2xl text-paper mb-2">Before you continue</h1>
        <p className="text-sm text-muted mb-6">
          Please review and agree to our Terms of Service to start trading on Birrly.
        </p>

        <div className="bg-surface border border-white/10 rounded-xl p-6 max-h-[60vh] overflow-y-auto space-y-6 text-sm text-muted leading-relaxed">
          <section>
            <h2 className="text-paper font-medium mb-2">1. Acceptance of terms</h2>
            <p>
              By creating an account or using Birrly, you agree to these Terms of Service. If you do not agree,
              please do not use the platform.
            </p>
          </section>

          <section>
            <h2 className="text-paper font-medium mb-2">2. What Birrly does</h2>
            <p>
              Birrly is a peer-to-peer marketplace connecting buyers and sellers of USDT and Ethiopian Birr. We
              facilitate trades and hold USDT in escrow for the duration of an active trade. We are not a bank, and
              we do not custody funds outside of that escrow period.
            </p>
          </section>

          <section>
            <h2 className="text-paper font-medium mb-2">3. Your responsibilities</h2>
            <p>
              You are responsible for the accuracy of information you provide, for completing fiat payments
              honestly and on time, and for keeping your account and 2FA credentials secure. You must not use
              Birrly for money laundering, fraud, or any illegal activity.
            </p>
          </section>

          <section>
            <h2 className="text-paper font-medium mb-2">4. Fees</h2>
            <p>
              A commission (currently 2%) is charged on the USDT side of a trade only when it completes
              successfully. Fees may change; we'll make reasonable efforts to communicate changes in advance.
            </p>
          </section>

          <section>
            <h2 className="text-paper font-medium mb-2">5. Disputes</h2>
            <p>
              If a trade is disputed, our team reviews the chat history between both parties and makes a decision
              to release funds to the buyer or refund the seller. This decision is final.
            </p>
          </section>

          <section>
            <h2 className="text-paper font-medium mb-2">6. Account suspension</h2>
            <p>
              We may suspend or terminate accounts that violate these terms, engage in fraudulent behavior, or pose
              a risk to other users.
            </p>
          </section>

          <section>
            <h2 className="text-paper font-medium mb-2">7. Limitation of liability</h2>
            <p>
              Birrly is provided "as is." We are not liable for losses arising from market volatility, user error,
              or circumstances outside our reasonable control. See our{' '}
              <a href="/risk-disclosure" target="_blank" className="text-teal hover:underline">
                Risk Disclosure
              </a>{' '}
              for more detail.
            </p>
          </section>

          <section>
            <h2 className="text-paper font-medium mb-2">8. Changes to these terms</h2>
            <p>We may update these terms from time to time. Continued use of Birrly means you accept the changes.</p>
          </section>
        </div>

        <p className="text-xs text-muted mt-3">
          Full text also available on our{' '}
          <a href="/terms" target="_blank" className="text-teal hover:underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" target="_blank" className="text-teal hover:underline">
            Privacy Policy
          </a>{' '}
          pages.
        </p>

        <label className="flex items-start gap-2 mt-5 text-sm text-paper">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-1"
          />
          I have read and agree to the Terms of Service, Privacy Policy, and Risk Disclosure.
        </label>

        {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

        <button
          onClick={handleContinue}
          disabled={!checked || submitting}
          className="w-full mt-6 rounded-md bg-gradient-to-br from-gold to-teal py-3 text-onaccent font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {submitting ? 'Saving…' : 'Agree & continue'}
        </button>
      </div>
    </main>
  );
}
