'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

const faqs = [
  {
    q: 'How does escrow protect my trade?',
    a: 'The seller’s USDT is locked the moment a trade starts, before any fiat has moved. It can only be released once the seller confirms payment, or an admin resolves a dispute.',
  },
  {
    q: 'How long do deposits and withdrawals take?',
    a: 'Deposits are confirmed after we verify your transaction on-chain. Withdrawals are sent from our platform wallet, usually within a few hours.',
  },
  {
    q: 'What if the other trader doesn’t pay or won’t confirm?',
    a: 'Raise a dispute from the trade page. Our team reviews the full chat log and resolves it — releasing the USDT to the buyer or refunding the seller.',
  },
  {
    q: 'Is there a fee?',
    a: 'A 2% commission applies to the USDT side only when a trade completes successfully. There’s no fee for posting ads, cancelling, or failed trades.',
  },
];

export default function SupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function loadTickets() {
    try {
      setTickets(await apiFetch('/support/tickets/mine'));
    } catch (err: any) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadTickets();
  }, []);

  async function submitTicket(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    try {
      await apiFetch('/support/tickets', {
        method: 'POST',
        body: JSON.stringify({ subject, message }),
      });
      setSubject('');
      setMessage('');
      setSuccess(true);
      loadTickets();
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <main className="min-h-screen bg-ink px-6 py-10 md:px-12">
      <div className="max-w-2xl mx-auto space-y-10">
        <div>
          <h1 className="font-display font-bold text-2xl text-paper mb-6">Support</h1>

          <div className="bg-surface border border-white/10 rounded-xl p-5 mb-6">
            <h2 className="font-display font-medium text-paper mb-3">Frequently asked questions</h2>
            <div className="space-y-4">
              {faqs.map((faq) => (
                <div key={faq.q}>
                  <p className="text-sm text-paper font-medium">{faq.q}</p>
                  <p className="text-sm text-muted mt-1">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface border border-white/10 rounded-xl p-5">
            <h2 className="font-display font-medium text-paper mb-2">Still need help?</h2>
            <p className="text-sm text-muted">
              Reach us at{' '}
              <a href="mailto:support@birrly.app" className="text-teal">
                support@birrly.app
              </a>{' '}
              or submit a request below.
            </p>
          </div>
        </div>

        <div className="bg-surface border border-white/10 rounded-xl p-5">
          <h2 className="font-display font-medium text-paper mb-4">Submit a request</h2>
          <form onSubmit={submitTicket} className="space-y-3">
            <input
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              className="w-full bg-surfaceRaised rounded-md px-3 py-2 text-paper outline-none focus:ring-2 focus:ring-teal"
            />
            <textarea
              placeholder="Describe your issue..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={4}
              className="w-full bg-surfaceRaised rounded-md px-3 py-2 text-paper outline-none focus:ring-2 focus:ring-teal"
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            {success && <p className="text-teal text-sm">Request submitted — we’ll get back to you soon.</p>}
            <button type="submit" className="rounded-md bg-gradient-to-br from-gold to-teal px-4 py-2 text-ink font-medium hover:opacity-90 transition-opacity">
              Submit
            </button>
          </form>
        </div>

        {tickets.length > 0 && (
          <div className="bg-surface border border-white/10 rounded-xl p-5">
            <h2 className="font-display font-medium text-paper mb-4">Your requests</h2>
            <div className="space-y-3">
              {tickets.map((t) => (
                <div key={t.id} className="flex items-start justify-between gap-4 text-sm">
                  <div>
                    <p className="text-paper font-medium">{t.subject}</p>
                    <p className="text-muted text-xs mt-1">{t.message}</p>
                  </div>
                  <span className={t.status === 'RESOLVED' ? 'text-teal text-xs shrink-0' : 'text-gold text-xs shrink-0'}>
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
