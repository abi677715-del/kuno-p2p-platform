'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { apiFetch, API_URL } from '@/lib/api';
import { displayName } from '@/lib/displayName';
import { formatAmount } from '@/lib/format';

const POLL_MS = 4000;

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pending',
  ESCROW_LOCKED: 'Escrow locked — send payment',
  PAID: 'Payment marked — awaiting confirmation',
  COMPLETED: 'Completed',
  DISPUTED: 'Disputed',
  CANCELLED: 'Cancelled',
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'text-muted',
  ESCROW_LOCKED: 'text-gold',
  PAID: 'text-gold',
  COMPLETED: 'text-teal',
  DISPUTED: 'text-red-400',
  CANCELLED: 'text-muted',
};

function TimeoutCountdown({ timeoutAt, status }: { timeoutAt: string | null; status: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!timeoutAt) return null;

  const remainingMs = new Date(timeoutAt).getTime() - now;
  if (remainingMs <= 0) return null;

  const minutes = Math.floor(remainingMs / 60_000);
  const seconds = Math.floor((remainingMs % 60_000) / 1000);
  const label =
    status === 'ESCROW_LOCKED'
      ? 'Auto-cancels if unpaid in'
      : 'Escalates to support if unconfirmed in';
  const urgent = remainingMs < 5 * 60_000;

  return (
    <p className={`text-xs font-mono mt-2 ${urgent ? 'text-red-400' : 'text-muted'}`}>
      {label} {minutes}:{seconds.toString().padStart(2, '0')}
    </p>
  );
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
  const [me, setMe] = useState<any>(null);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmCode, setConfirmCode] = useState('');
  const [showDisputeForm, setShowDisputeForm] = useState(false);

  async function loadTrade() {
    try {
      setTrade(await apiFetch(`/trades/${tradeId}`));
    } catch (err: any) {
      setError(err.message);
    }
  }

  useEffect(() => {
    apiFetch('/users/me').then(setMe).catch(() => {});
    loadTrade();
    apiFetch(`/trades/${tradeId}/read`, { method: 'POST' }).catch(() => {});
  }, [tradeId]);

  useEffect(() => {
    const interval = setInterval(loadTrade, POLL_MS);
    return () => clearInterval(interval);
  }, [tradeId]);

  if (!trade) return <main className="min-h-screen bg-ink px-6 py-10 text-muted">{error || 'Loading…'}</main>;

  const isBuyer = me?.id === trade.buyerId;
  const isSeller = me?.id === trade.sellerId;
  const counterparty = isBuyer ? trade.seller : trade.buyer;

  async function act(action: 'paid' | 'confirm' | 'cancel', body?: any) {
    setActionError('');
    setBusy(true);
    try {
      await apiFetch(`/trades/${tradeId}/${action}`, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
      await loadTrade();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function submitDispute(reason: string, evidenceUrl?: string) {
    setActionError('');
    setBusy(true);
    try {
      await apiFetch(`/trades/${tradeId}/dispute`, { method: 'POST', body: JSON.stringify({ reason, evidenceUrl }) });
      setShowDisputeForm(false);
      await loadTrade();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-ink px-6 py-10 md:px-12">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-surface border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h1 className="font-display font-bold text-xl text-paper">Trade room</h1>
            <span className={`text-sm font-mono uppercase ${STATUS_COLOR[trade.status] ?? 'text-muted'}`}>
              {STATUS_LABEL[trade.status] ?? trade.status}
            </span>
          </div>

          {trade.code && <p className="font-mono text-xs text-muted mt-1">{trade.code}</p>}

          <TimeoutCountdown timeoutAt={trade.timeoutAt ?? null} status={trade.status} />

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-surfaceRaised rounded-md p-3">
              <p className="text-[11px] text-muted">Amount</p>
              <p className="font-mono text-paper">{formatAmount(trade.amountUsdt, 4)} USDT</p>
              <p className="font-mono text-xs text-muted">≈ {formatAmount(trade.amountEtb)} ETB</p>
            </div>
            <div className="bg-surfaceRaised rounded-md p-3">
              <p className="text-[11px] text-muted">Trading with</p>
              <p className="text-paper">{counterparty ? displayName(counterparty) : '—'}</p>
              <p className="text-[11px] text-muted">{isBuyer ? 'You are the buyer' : isSeller ? 'You are the seller' : ''}</p>
            </div>
          </div>

          {trade.feePercent !== undefined && (
            <p className="text-xs text-muted mt-3">
              A {trade.feePercent}% platform fee applies to the USDT side when this trade completes.
            </p>
          )}

          {actionError && <p className="text-red-400 text-sm mt-3">{actionError}</p>}

          <div className="flex flex-wrap gap-2 mt-4">
            {isBuyer && trade.status === 'ESCROW_LOCKED' && (
              <button
                onClick={() => act('paid')}
                disabled={busy}
                className="rounded-md bg-gradient-to-br from-gold to-teal px-4 py-2 text-onaccent font-medium disabled:opacity-50"
              >
                Mark as paid
              </button>
            )}

            {isSeller && trade.status === 'PAID' && (
              <div className="flex items-center gap-2">
                {me?.twoFaEnabled && (
                  <input
                    value={confirmCode}
                    onChange={(e) => setConfirmCode(e.target.value)}
                    placeholder="2FA code"
                    className="bg-surfaceRaised rounded-md px-3 py-2 text-paper outline-none focus:ring-2 focus:ring-teal w-28"
                  />
                )}
                <button
                  onClick={() => act('confirm', { code: confirmCode || undefined })}
                  disabled={busy}
                  className="rounded-md bg-gradient-to-br from-gold to-teal px-4 py-2 text-onaccent font-medium disabled:opacity-50"
                >
                  Confirm payment received
                </button>
              </div>
            )}

            {(trade.status === 'PENDING' || trade.status === 'ESCROW_LOCKED') && (isBuyer || isSeller) && (
              <button
                onClick={() => act('cancel')}
                disabled={busy}
                className="rounded-md border border-white/15 px-4 py-2 text-paper font-medium disabled:opacity-50"
              >
                Cancel trade
              </button>
            )}

            {!['COMPLETED', 'CANCELLED'].includes(trade.status) && (isBuyer || isSeller) && !showDisputeForm && (
              <button
                onClick={() => setShowDisputeForm(true)}
                disabled={busy}
                className="rounded-md border border-red-400/30 px-4 py-2 text-red-400 font-medium disabled:opacity-50"
              >
                Raise dispute
              </button>
            )}
          </div>

          {showDisputeForm && (
            <DisputeForm busy={busy} onCancel={() => setShowDisputeForm(false)} onSubmit={submitDispute} />
          )}
        </div>

        {trade.status === 'COMPLETED' && (isBuyer || isSeller) && <RatingCard tradeId={tradeId} />}

        {(isBuyer || isSeller) && <TradeChat tradeId={tradeId} myUserId={me?.id} />}
      </div>
    </main>
  );
}

function RatingCard({ tradeId }: { tradeId: string }) {
  const [myRating, setMyRating] = useState<any>(undefined);
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiFetch(`/trades/${tradeId}/rating`)
      .then(setMyRating)
      .catch(() => setMyRating(null));
  }, [tradeId]);

  async function submit() {
    setSubmitting(true);
    setError('');
    try {
      const rating = await apiFetch(`/trades/${tradeId}/rate`, {
        method: 'POST',
        body: JSON.stringify({ stars, comment: comment || undefined }),
      });
      setMyRating(rating);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (myRating === undefined) return null;

  return (
    <div className="bg-surface border border-white/10 rounded-xl p-6">
      <h2 className="font-display font-medium text-paper mb-3">Rate this trade</h2>
      {myRating ? (
        <p className="text-sm text-teal">
          You rated this trade {myRating.stars} ★{myRating.comment ? ` — "${myRating.comment}"` : ''}
        </p>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setStars(n)}
                className={`text-2xl leading-none ${n <= stars ? 'text-gold' : 'text-white/15'}`}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Optional comment about this trader..."
            maxLength={500}
            rows={2}
            className="w-full bg-surfaceRaised rounded-md px-3 py-2 text-sm text-paper outline-none focus:ring-2 focus:ring-teal resize-none"
          />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button
            onClick={submit}
            disabled={submitting}
            className="rounded-md bg-gradient-to-br from-gold to-teal px-4 py-2 text-onaccent text-sm font-medium disabled:opacity-50"
          >
            Submit rating
          </button>
        </div>
      )}
    </div>
  );
}

function DisputeForm({
  busy,
  onCancel,
  onSubmit,
}: {
  busy: boolean;
  onCancel: () => void;
  onSubmit: (reason: string, evidenceUrl?: string) => void;
}) {
  const [reason, setReason] = useState('');
  const [evidence, setEvidence] = useState<string | null>(null);
  const [formError, setFormError] = useState('');

  async function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setEvidence(await resizeImage(file));
    } catch {
      setFormError('Could not attach that file — try a photo instead.');
    }
  }

  function submit() {
    if (reason.trim().length < 10) {
      setFormError('Please describe the issue in at least 10 characters.');
      return;
    }
    setFormError('');
    onSubmit(reason.trim(), evidence ?? undefined);
  }

  return (
    <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
      <h3 className="text-sm font-medium text-paper">Raise a dispute</h3>
      <p className="text-xs text-muted">
        Describe the issue and, if you have one, attach evidence (a payment receipt, screenshot, etc.) — our team will review the chat log alongside it.
      </p>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Describe the issue (at least 10 characters)..."
        maxLength={2000}
        rows={3}
        className="w-full bg-surfaceRaised rounded-md px-3 py-2 text-sm text-paper outline-none focus:ring-2 focus:ring-teal resize-none"
      />

      {evidence ? (
        <div className="flex items-center gap-2 bg-surfaceRaised rounded-md p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={evidence} alt="Evidence" className="h-10 w-10 object-cover rounded" />
          <span className="text-xs text-muted flex-1">Evidence attached</span>
          <button type="button" onClick={() => setEvidence(null)} className="text-xs text-red-400 font-medium">
            Remove
          </button>
        </div>
      ) : (
        <div>
          <input type="file" id="dispute-evidence" accept="image/*" onChange={handleFilePick} className="hidden" />
          <label
            htmlFor="dispute-evidence"
            className="inline-block rounded-md border border-white/15 px-3 py-2 text-paper text-xs font-medium cursor-pointer"
          >
            📎 Attach evidence (optional)
          </label>
        </div>
      )}

      {formError && <p className="text-red-400 text-xs">{formError}</p>}

      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={busy}
          className="rounded-md bg-red-400/20 border border-red-400/30 px-4 py-2 text-red-400 text-sm font-medium disabled:opacity-50"
        >
          Submit dispute
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="rounded-md border border-white/15 px-4 py-2 text-paper text-sm font-medium disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function TradeChat({ tradeId, myUserId }: { tradeId: string; myUserId?: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [attachment, setAttachment] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  async function load() {
    try {
      setMessages(await apiFetch(`/trades/${tradeId}/messages`));
    } catch (err: any) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 20_000);
    return () => clearInterval(interval);
  }, [tradeId]);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    const socket = io(API_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('joinTrade', tradeId);
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('newMessage', (msg: any) => {
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [tradeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

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
      if (socketRef.current?.connected) {
        socketRef.current.emit('sendMessage', {
          tradeId,
          message: text || undefined,
          attachmentUrl: attachment ?? undefined,
        });
      } else {
        await apiFetch(`/trades/${tradeId}/messages`, {
          method: 'POST',
          body: JSON.stringify({ message: text || undefined, attachmentUrl: attachment ?? undefined }),
        });
        load();
      }
      setText('');
      setAttachment(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="bg-surface border border-white/10 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="font-display font-medium text-paper">Chat</h2>
        <span className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-teal' : 'bg-white/20'}`} title={connected ? 'Live' : 'Reconnecting…'} />
      </div>
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {messages.map((m) => (
          <div key={m.id} className={`text-xs ${m.senderId === myUserId ? 'text-right' : ''}`}>
            <span className="text-muted">{m.senderId === myUserId ? 'You' : 'Them'} · {new Date(m.createdAt).toLocaleString()}</span>
            {m.message && <p className="text-paper mt-0.5">{m.message}</p>}
            {m.attachmentUrl && (
              <a href={m.attachmentUrl} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.attachmentUrl} alt="Attachment" className="mt-1 max-h-40 rounded-md border border-white/10 inline-block" />
              </a>
            )}
          </div>
        ))}
        {messages.length === 0 && <p className="text-muted text-xs">No messages yet.</p>}
        <div ref={bottomRef} />
      </div>

      {attachment && (
        <div className="flex items-center gap-2 bg-surfaceRaised rounded-md p-2 mt-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={attachment} alt="Pending attachment" className="h-10 w-10 object-cover rounded" />
          <span className="text-xs text-muted flex-1">Attached — will send with your next message</span>
          <button type="button" onClick={() => setAttachment(null)} className="text-xs text-red-400 font-medium">
            Remove
          </button>
        </div>
      )}

      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}

      <div className="flex gap-2 mt-3">
        <input type="file" id={`file-${tradeId}`} accept="image/*" onChange={handleFilePick} className="hidden" />
        <label
          htmlFor={`file-${tradeId}`}
          className="rounded-md border border-white/15 px-3 py-2 text-paper text-sm font-medium cursor-pointer shrink-0"
          title="Attach a photo (e.g. payment receipt)"
        >
          📎
        </label>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Write a message..."
          className="flex-1 bg-surfaceRaised rounded-md px-3 py-2 text-sm text-paper outline-none focus:ring-2 focus:ring-teal"
        />
        <button
          onClick={send}
          disabled={sending}
          className="rounded-md bg-gradient-to-br from-gold to-teal px-4 py-2 text-onaccent text-sm font-medium disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
