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

function resizeImage(file: File, maxSize = 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

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
            <button type="submit" className="rounded-md bg-gradient-to-br from-gold to-teal px-4 py-2 text-onaccent font-medium hover:opacity-90 transition-opacity">
              Submit
            </button>
          </form>
        </div>

        {tickets.length > 0 && (
          <div className="bg-surface border border-white/10 rounded-xl p-5">
            <h2 className="font-display font-medium text-paper mb-4">Your requests</h2>
            <div className="space-y-3">
              {tickets.map((t) => (
                <div key={t.id} className="border-b border-white/5 last:border-0 pb-3 last:pb-0">
                  <button
                    onClick={() => setOpenId(openId === t.id ? null : t.id)}
                    className="w-full flex items-start justify-between gap-4 text-sm text-left"
                  >
                    <div>
                      <p className="text-paper font-medium">{t.subject}</p>
                      <p className="text-muted text-xs mt-1">{t.message}</p>
                    </div>
                    <span className={t.status === 'RESOLVED' ? 'text-teal text-xs shrink-0' : 'text-gold text-xs shrink-0'}>
                      {t.status}
                    </span>
                  </button>
                  {openId === t.id && <TicketThread ticketId={t.id} />}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function TicketThread({ ticketId }: { ticketId: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [attachment, setAttachment] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  async function load() {
    try {
      setMessages(await apiFetch(`/support/tickets/${ticketId}/messages`));
    } catch (err: any) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, [ticketId]);

  async function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setAttachment(await resizeImage(file));
    } catch {
      setError('Could not attach that file — try a photo instead.');
    }
  }

  async function send() {
    if (!text.trim() && !attachment) return;
    setSending(true);
    setError('');
    try {
      await apiFetch(`/support/tickets/${ticketId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ message: text || undefined, attachmentUrl: attachment ?? undefined }),
      });
      setText('');
      setAttachment(null);
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-3 bg-surfaceRaised rounded-lg p-3 space-y-3">
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {messages.map((m) => (
          <div key={m.id} className="text-xs">
            <span className="text-muted">{m.sender?.role === 'USER' ? 'You' : 'Support'} · {new Date(m.createdAt).toLocaleString()}</span>
            {m.message && <p className="text-paper mt-0.5">{m.message}</p>}
            {m.attachmentUrl && (
              <a href={m.attachmentUrl} target="_blank" rel="noopener noreferrer">
                <img src={m.attachmentUrl} alt="Attachment" className="mt-1 max-h-40 rounded-md border border-white/10" />
              </a>
            )}
          </div>
        ))}
        {messages.length === 0 && <p className="text-muted text-xs">No messages yet.</p>}
      </div>

      {attachment && (
        <div className="flex items-center gap-2 bg-surface rounded-md p-2">
          <img src={attachment} alt="Pending attachment" className="h-10 w-10 object-cover rounded" />
          <span className="text-xs text-muted flex-1">Attached — will send with your next message</span>
          <button type="button" onClick={() => setAttachment(null)} className="text-xs text-red-400 font-medium">
            Remove
          </button>
        </div>
      )}

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <div className="flex gap-2">
        <input type="file" id={`file-${ticketId}`} accept="image/*" onChange={handleFilePick} className="hidden" />
        <label
          htmlFor={`file-${ticketId}`}
          className="rounded-md border border-white/15 px-3 py-2 text-paper text-sm font-medium cursor-pointer shrink-0"
          title="Attach a photo or document"
        >
          📎
        </label>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a message..."
          className="flex-1 bg-surface rounded-md px-3 py-2 text-sm text-paper outline-none focus:ring-2 focus:ring-teal"
        />
        <button
          onClick={send}
          disabled={sending || (!text.trim() && !attachment)}
          className="rounded-md bg-gradient-to-br from-gold to-teal px-3 py-2 text-onaccent text-sm font-medium disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
