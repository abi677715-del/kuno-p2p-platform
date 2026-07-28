'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { apiFetch, API_URL } from '@/lib/api';
import { formatAmount } from '@/lib/format';

const STATUS_COPY: Record<string, string> = {
  PENDING: 'Waiting for escrow to lock',
  ESCROW_LOCKED: 'USDT is held in escrow — buyer should send payment',
  PAID: 'Buyer marked as paid — waiting for seller to confirm',
  COMPLETED: 'Trade complete — USDT released',
  DISPUTED: 'Under dispute review',
  CANCELLED: 'Trade cancelled',
};

const TIMEOUT_MINUTES = 15;

function TradeCountdown({ trade }: { trade: any }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  let deadline: number | null = null;
  let label = '';
  if (trade.status === 'ESCROW_LOCKED') {
    deadline = new Date(trade.createdAt).getTime() + TIMEOUT_MINUTES * 60_000;
    label = 'Auto-cancels in';
  } else if (trade.status === 'PAID' && trade.paidAt) {
    deadline = new Date(trade.paidAt).getTime() + TIMEOUT_MINUTES * 60_000;
    label = 'Escalates to dispute in';
  }
  if (deadline === null) return null;

  const remainingMs = Math.max(0, deadline - now);
  const minutes = Math.floor(remainingMs / 60_000);
  const seconds = Math.floor((remainingMs % 60_000) / 1000);

  return (
    <p className="text-xs text-gold font-mono mt-1">
      {remainingMs > 0
        ? `${label} ${minutes}:${seconds.toString().padStart(2, '0')}`
        : 'Processing timeout…'}
    </p>
  );
}

function getUserId(): string | null {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split('.')[1])).sub ?? null;
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

export default function TradeRoomPage() {
  const params = useParams();
  const tradeId = params.id as string;
  const [trade, setTrade] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [attachment, setAttachment] = useState<string | null>(null);
  const [attachError, setAttachError] = useState('');
  const [twoFaEnabled, setTwoFaEnabled] = useState(false);
  const [confirmCode, setConfirmCode] = useState('');
  const [relations, setRelations] = useState<any[]>([]);
  const [relationBusy, setRelationBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const userId = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function refreshTrade() {
    try {
      setTrade(await apiFetch(`/trades/${tradeId}`));
    } catch (err: any) {
      setError(err.message);
    }
  }

  useEffect(() => {
    userId.current = getUserId();

    apiFetch(`/trades/${tradeId}/messages`)
      .then(setMessages)
      .catch((err) => setError(err.message));
    apiFetch('/users/me')
      .then((data) => setTwoFaEnabled(!!data.twoFaEnabled))
      .catch(() => {});
    apiFetch('/relations/mine').then(setRelations).catch(() => {});
    refreshTrade();
    const statusInterval = setInterval(refreshTrade, 5000);

    const token = localStorage.getItem('accessToken');
    const socket = io(API_URL, { transports: ['websocket'], auth: { token } });
    socketRef.current = socket;
    socket.emit('joinTrade', tradeId);
    socket.on('newMessage', (msg) => {
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
    });

    return () => {
      clearInterval(statusInterval);
      socket.disconnect();
    };
  }, [tradeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (messages.length > 0) {
      apiFetch(`/trades/${tradeId}/read`, { method: 'POST' }).catch(() => {});
    }
  }, [messages.length]);

  async function toggleRelation(type: 'block' | 'favorite') {
    const counterpartyId = trade.buyerId === userId.current ? trade.sellerId : trade.buyerId;
    setRelationBusy(true);
    try {
      const active = relations.some((r) => r.targetUser.id === counterpartyId && r.type === type.toUpperCase());
      await apiFetch(`/relations/${counterpartyId}/${type}`, { method: active ? 'DELETE' : 'POST' });
      setRelations(await apiFetch('/relations/mine'));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRelationBusy(false);
    }
  }

  async function act(action: 'paid' | 'confirm' | 'cancel', body?: Record<string, unknown>) {
    try {
      await apiFetch(`/trades/${tradeId}/${action}`, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
      setConfirmCode('');
      refreshTrade();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function raiseDispute() {
    const reason = window.prompt('Briefly describe the issue:');
    if (!reason) return;
    try {
      await apiFetch(`/trades/${tradeId}/dispute`, { method: 'POST', body: JSON.stringify({ reason }) });
      refreshTrade();
    } catch (err: any) {
      setError(err.message);
    }
  }

  function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if ((!text.trim() && !attachment) || !userId.current || !socketRef.current) return;
    socketRef.current.emit('sendMessage', { tradeId, message: text, attachmentUrl: attachment ?? undefined });
    setText('');
    setAttachment(null);
  }

  async function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setAttachError('');
    try {
      setAttachment(await resizeImage(file));
    } catch {
      setAttachError('Could not attach that file — try a photo instead.');
    }
  }

  if (!trade) return <main className="min-h-screen bg-ink px-6 py-10 text-muted">{error || 'Loading…'}</main>;

  const feePercent = trade.feePercent ?? 2;
  const counterpartyId = trade.buyerId === userId.current ? trade.sellerId : trade.buyerId;
  const counterpartyLastReadAt = trade.buyerId === userId.current ? trade.sellerLastReadAt : trade.buyerLastReadAt;
  const isBlocked = relations.some((r) => r.targetUser.id === counterpartyId && r.type === 'BLOCK');
  const isFavorited = relations.some((r) => r.targetUser.id === counterpartyId && r.type === 'FAVORITE');
  const lastOwnMessageId = [...messages].reverse().find((m) => m.senderId === userId.current)?.id;

  return (
    <main className="min-h-screen bg-ink px-6 py-10 md:px-12">
      <div className="max-w-2xl mx-auto">
        <div className="bg-gold/10 border border-gold/30 rounded-xl p-4 mb-4">
          <p className="text-xs text-gold">
            ⚠️ Only confirm and release USDT after you've verified the payment actually arrived in your
            bank or mobile money account. Releasing escrow is immediate and cannot be undone.
          </p>
        </div>

        <div className="bg-surface border border-white/10 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-xs text-teal uppercase">{trade.status}</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleRelation('favorite')}
                disabled={relationBusy}
                className={`text-xs disabled:opacity-50 ${isFavorited ? 'text-gold' : 'text-muted hover:text-gold'}`}
              >
                {isFavorited ? '★ Favorited' : '☆ Favorite'}
              </button>
              <button
                onClick={() => toggleRelation('block')}
                disabled={relationBusy}
                className={`text-xs disabled:opacity-50 ${isBlocked ? 'text-red-400' : 'text-muted hover:text-red-400'}`}
              >
                {isBlocked ? 'Unblock' : 'Block'}
              </button>
              <span className="font-mono text-paper">
                {formatAmount(trade.amountUsdt, 4)} USDT ≈ {formatAmount(trade.amountEtb)} ETB
              </span>
            </div>
          </div>
          <p className="text-sm text-muted mb-1">{STATUS_COPY[trade.status] ?? ''}</p>
          <TradeCountdown trade={trade} />
          <p className="text-xs text-muted mb-4">
            A {feePercent}% platform fee applies on completion — the buyer receives ≈{' '}
            {formatAmount(parseFloat(trade.amountUsdt) * (1 - feePercent / 100), 4)} USDT after the fee.
          </p>

          <div className="flex gap-3 flex-wrap">
            {trade.status === 'ESCROW_LOCKED' && (
              <button onClick={() => act('paid')} className="rounded-md bg-gradient-to-br from-gold to-teal px-4 py-2 text-ink text-sm font-medium hover:opacity-90 transition-opacity">
                Mark as paid
              </button>
            )}
            {trade.status === 'PAID' && !twoFaEnabled && (
              <button onClick={() => act('confirm')} className="rounded-md bg-gradient-to-br from-gold to-teal px-4 py-2 text-ink text-sm font-medium hover:opacity-90 transition-opacity">
                Confirm payment received
              </button>
            )}
            {trade.status === 'PAID' && twoFaEnabled && (
              <div className="flex items-center gap-2 w-full">
                <input
                  value={confirmCode}
                  onChange={(e) => setConfirmCode(e.target.value)}
                  placeholder="Authenticator code"
                  className="w-36 bg-surfaceRaised rounded-md px-3 py-2 text-paper text-sm outline-none focus:ring-2 focus:ring-teal"
                />
                <button
                  onClick={() => act('confirm', { code: confirmCode })}
                  disabled={!confirmCode}
                  className="rounded-md bg-gradient-to-br from-gold to-teal px-4 py-2 text-ink text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  Confirm & release
                </button>
              </div>
            )}
            {['PENDING', 'ESCROW_LOCKED'].includes(trade.status) && (
              <button
                onClick={() => act('cancel')}
                className="rounded-md border border-white/15 px-4 py-2 text-paper text-sm font-medium"
              >
                Cancel trade
              </button>
            )}
            {['ESCROW_LOCKED', 'PAID'].includes(trade.status) && (
              <button
                onClick={raiseDispute}
                className="rounded-md border border-white/15 px-4 py-2 text-red-400 text-sm font-medium"
              >
                Raise a dispute
              </button>
            )}
          </div>
          {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
        </div>

        <div className="bg-surface border border-white/10 rounded-xl p-5 flex flex-col h-96">
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {messages.map((m) => (
              <div key={m.id} className="text-sm">
                <span className="text-muted font-mono text-xs">
                  {new Date(m.createdAt).toLocaleTimeString()}
                </span>
                {m.message && <p className="text-paper">{m.message}</p>}
                {m.attachmentUrl && (
                  <a href={m.attachmentUrl} target="_blank" rel="noopener noreferrer">
                    <img
                      src={m.attachmentUrl}
                      alt="Attachment"
                      className="mt-1 max-h-48 rounded-md border border-white/10"
                    />
                  </a>
                )}
                {m.id === lastOwnMessageId &&
                  counterpartyLastReadAt &&
                  new Date(m.createdAt) <= new Date(counterpartyLastReadAt) && (
                    <p className="text-[10px] text-muted mt-0.5">Seen</p>
                  )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          {attachError && <p className="text-red-400 text-xs mt-2">{attachError}</p>}
          {attachment && (
            <div className="flex items-center gap-2 mt-3 bg-surfaceRaised rounded-md p-2">
              <img src={attachment} alt="Pending attachment" className="h-12 w-12 object-cover rounded" />
              <span className="text-xs text-muted flex-1">Attached — will send with your next message</span>
              <button
                type="button"
                onClick={() => setAttachment(null)}
                className="text-xs text-red-400 font-medium"
              >
                Remove
              </button>
            </div>
          )}
          <form onSubmit={sendMessage} className="flex gap-2 mt-4">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFilePick} className="hidden" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-md border border-white/15 px-3 py-2 text-paper text-sm font-medium"
              title="Attach a photo"
            >
              📎
            </button>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Message the other trader…"
              className="flex-1 bg-surfaceRaised rounded-md px-3 py-2 text-paper outline-none focus:ring-2 focus:ring-teal"
            />
            <button type="submit" className="rounded-md bg-gradient-to-br from-gold to-teal px-4 py-2 text-ink font-medium hover:opacity-90 transition-opacity">
              Send
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
