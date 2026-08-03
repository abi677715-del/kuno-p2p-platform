'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { formatAmount } from '@/lib/format';

function getRole(): string | null {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split('.')[1])).role ?? null;
  } catch {
    return null;
  }
}

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

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  async function load() {
    try {
      setTickets(await apiFetch('/support/admin/tickets'));
    } catch (err: any) {
      setError(err.message);
    }
  }

  useEffect(() => {
    setIsAdmin(getRole() === 'ADMIN');
    load();
  }, []);

  async function resolve(id: string) {
    await apiFetch(`/support/admin/tickets/${id}/resolve`, { method: 'POST' });
    load();
  }

  async function remove(id: string) {
    if (!window.confirm('Delete this resolved ticket? This cannot be undone.')) return;
    await apiFetch(`/support/admin/tickets/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <main className="min-h-screen bg-ink px-6 py-10 md:px-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-display font-bold text-2xl text-paper mb-6">Support tickets</h1>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <div className="space-y-4">
          {tickets.map((t) => (
            <div key={t.id} className="bg-surface border border-white/10 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-paper font-medium">{t.subject}</p>
                <span className={t.status === 'RESOLVED' ? 'text-teal text-xs' : 'text-gold text-xs'}>
                  {t.status}
                </span>
              </div>
              <p className="text-xs text-muted mb-2">{t.user.email}</p>
              <p className="text-sm text-paper mb-4">{t.message}</p>

              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setOpenId(openId === t.id ? null : t.id)}
                  className="rounded-md border border-white/15 px-3 py-1.5 text-paper text-sm font-medium"
                >
                  {openId === t.id ? 'Hide' : 'Open'} conversation
                </button>
                {t.status !== 'RESOLVED' ? (
                  <button
                    onClick={() => resolve(t.id)}
                    className="rounded-md bg-gradient-to-br from-gold to-teal px-3 py-1.5 text-ink text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    Mark resolved
                  </button>
                ) : (
                  <button
                    onClick={() => remove(t.id)}
                    className="rounded-md border border-red-400/40 px-3 py-1.5 text-red-400 text-sm font-medium hover:bg-red-400/10 transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>

              {openId === t.id && (
                <div className="space-y-4">
                  <TicketThread ticketId={t.id} />
                  {isAdmin && <CustomerContext ticketId={t.id} />}
                </div>
              )}
            </div>
          ))}
          {tickets.length === 0 && !error && <p className="text-muted text-sm">No support tickets.</p>}
        </div>
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
      setMessages(await apiFetch(`/support/admin/tickets/${ticketId}/messages`));
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
      await apiFetch(`/support/admin/tickets/${ticketId}/messages`, {
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
    <div className="bg-surfaceRaised rounded-lg p-3 space-y-3">
      <p className="text-xs text-muted font-medium">Conversation</p>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {messages.map((m) => (
          <div key={m.id} className="text-xs">
            <span className="text-muted">
              {m.sender?.role === 'USER' ? m.sender.email : 'Support'} · {new Date(m.createdAt).toLocaleString()}
            </span>
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
        <input type="file" id={`admin-file-${ticketId}`} accept="image/*" onChange={handleFilePick} className="hidden" />
        <label
          htmlFor={`admin-file-${ticketId}`}
          className="rounded-md border border-white/15 px-3 py-2 text-paper text-sm font-medium cursor-pointer shrink-0"
          title="Attach a photo or document"
        >
          📎
        </label>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Reply to this user..."
          className="flex-1 bg-surface rounded-md px-3 py-2 text-sm text-paper outline-none focus:ring-2 focus:ring-teal"
        />
        <button
          onClick={send}
          disabled={sending || (!text.trim() && !attachment)}
          className="rounded-md bg-gradient-to-br from-gold to-teal px-3 py-2 text-ink text-sm font-medium disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}

const TRADE_STATUS_COLOR: Record<string, string> = {
  COMPLETED: 'text-teal',
  DISPUTED: 'text-red-400',
  CANCELLED: 'text-muted',
};

/** ADMIN-only — shows the ticket's user's trade and wallet history so the admin has full context without asking the user to re-explain it. */
function CustomerContext({ ticketId }: { ticketId: string }) {
  const [data, setData] = useState<{ trades: any[]; transactions: any[] } | null>(null);
  const [error, setError] = useState('');
  const [openTradeId, setOpenTradeId] = useState<string | null>(null);
  const [tradeMessages, setTradeMessages] = useState<any[]>([]);

  useEffect(() => {
    apiFetch(`/support/admin/tickets/${ticketId}/context`)
      .then(setData)
      .catch((err) => setError(err.message));
  }, [ticketId]);

  async function toggleTrade(tradeId: string) {
    if (openTradeId === tradeId) {
      setOpenTradeId(null);
      return;
    }
    setOpenTradeId(tradeId);
    try {
      setTradeMessages(await apiFetch(`/trades/admin/disputes/${tradeId}/messages`));
    } catch (err: any) {
      setError(err.message);
    }
  }

  if (error) return <p className="text-red-400 text-xs">{error}</p>;
  if (!data) return null;

  return (
    <div className="bg-surfaceRaised rounded-lg p-3 space-y-4">
      <p className="text-xs text-muted font-medium">Customer activity (admin only)</p>

      <div>
        <p className="text-[11px] text-muted mb-1">Recent trades</p>
        <div className="space-y-1">
          {data.trades.map((t) => (
            <div key={t.id}>
              <button
                onClick={() => toggleTrade(t.id)}
                className="w-full flex items-center justify-between text-xs text-left hover:opacity-80"
              >
                <span className={TRADE_STATUS_COLOR[t.status] ?? 'text-gold'}>{t.status}</span>
                <span className="text-paper font-mono">{formatAmount(t.amountUsdt, 4)} USDT ≈ {formatAmount(t.amountEtb)} ETB</span>
                <span className="text-muted">{t.buyer.email} ↔ {t.seller.email}</span>
              </button>
              {openTradeId === t.id && (
                <div className="mt-1 mb-2 ml-2 pl-2 border-l border-white/10 space-y-1 max-h-40 overflow-y-auto">
                  {tradeMessages.map((m) => (
                    <div key={m.id} className="text-[11px]">
                      <span className="text-muted">{m.sender?.email} · {new Date(m.createdAt).toLocaleString()}</span>
                      {m.message && <p className="text-paper">{m.message}</p>}
                      {m.attachmentUrl && (
                        <a href={m.attachmentUrl} target="_blank" rel="noopener noreferrer">
                          <img src={m.attachmentUrl} alt="Attachment" className="mt-1 max-h-32 rounded border border-white/10" />
                        </a>
                      )}
                    </div>
                  ))}
                  {tradeMessages.length === 0 && <p className="text-muted text-[11px]">No chat messages.</p>}
                </div>
              )}
            </div>
          ))}
          {data.trades.length === 0 && <p className="text-muted text-xs">No trades yet.</p>}
        </div>
      </div>

      <div>
        <p className="text-[11px] text-muted mb-1">Recent wallet transactions</p>
        <div className="space-y-1">
          {data.transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between text-xs">
              <span className="text-muted">
                {tx.type} {tx.network ? `· ${tx.network}` : ''} · {new Date(tx.createdAt).toLocaleDateString()}
                {tx.code && <span className="font-mono text-[10px] text-muted/70 ml-1">{tx.code}</span>}
              </span>
              <span className="text-paper font-mono">{formatAmount(tx.amount, 4)}</span>
              <span className={tx.status === 'CONFIRMED' ? 'text-teal' : tx.status === 'FAILED' ? 'text-red-400' : 'text-gold'}>
                {tx.status}
              </span>
            </div>
          ))}
          {data.transactions.length === 0 && <p className="text-muted text-xs">No transactions yet.</p>}
        </div>
      </div>
    </div>
  );
}
