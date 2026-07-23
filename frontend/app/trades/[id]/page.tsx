'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';

const STATUS_COPY: Record<string, string> = {
  PENDING: 'Waiting for escrow to lock',
  ESCROW_LOCKED: 'USDT is held in escrow — buyer should send payment',
  PAID: 'Buyer marked as paid — waiting for seller to confirm',
  COMPLETED: 'Trade complete — USDT released',
  DISPUTED: 'Under dispute review',
  CANCELLED: 'Trade cancelled',
};

export default function TradeRoomPage() {
  const params = useParams();
  const tradeId = params.id as string;
  const [trade, setTrade] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  async function refresh() {
    try {
      const [t, m] = await Promise.all([
        apiFetch(`/trades/${tradeId}`),
        apiFetch(`/trades/${tradeId}/messages`),
      ]);
      setTrade(t);
      setMessages(m);
    } catch (err: any) {
      setError(err.message);
    }
  }

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 4000); // polling; swap for the socket.io gateway when ready
    return () => clearInterval(interval);
  }, [tradeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function act(action: 'paid' | 'confirm' | 'cancel') {
    try {
      await apiFetch(`/trades/${tradeId}/${action}`, { method: 'POST' });
      refresh();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function raiseDispute() {
    const reason = window.prompt('Briefly describe the issue:');
    if (!reason) return;
    try {
      await apiFetch(`/trades/${tradeId}/dispute`, { method: 'POST', body: JSON.stringify({ reason }) });
      refresh();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      await apiFetch(`/trades/${tradeId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ message: text }),
      });
      setText('');
      refresh();
    } catch (err: any) {
      setError(err.message);
    }
  }

  if (!trade) return <main className="min-h-screen bg-ink px-6 py-10 text-muted">{error || 'Loading…'}</main>;

  return (
    <main className="min-h-screen bg-ink px-6 py-10 md:px-12">
      <div className="max-w-2xl mx-auto">
        <div className="bg-surface border border-white/10 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-xs text-teal uppercase">{trade.status}</span>
            <span className="font-mono text-paper">
              {trade.amountUsdt} USDT ≈ {trade.amountEtb} ETB
            </span>
          </div>
          <p className="text-sm text-muted mb-1">{STATUS_COPY[trade.status] ?? ''}</p>
          <p className="text-xs text-muted mb-4">
            A 2% platform fee applies on completion — the buyer receives ≈{' '}
            {(parseFloat(trade.amountUsdt) * 0.98).toFixed(2)} USDT after the fee.
          </p>

          <div className="flex gap-3 flex-wrap">
            {trade.status === 'ESCROW_LOCKED' && (
              <button onClick={() => act('paid')} className="rounded-md bg-gold px-4 py-2 text-ink text-sm font-medium">
                Mark as paid
              </button>
            )}
            {trade.status === 'PAID' && (
              <button onClick={() => act('confirm')} className="rounded-md bg-teal px-4 py-2 text-ink text-sm font-medium">
                Confirm payment received
              </button>
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
                <p className="text-paper">{m.message}</p>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <form onSubmit={sendMessage} className="flex gap-2 mt-4">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Message the other trader…"
              className="flex-1 bg-surfaceRaised rounded-md px-3 py-2 text-paper outline-none focus:ring-2 focus:ring-teal"
            />
            <button type="submit" className="rounded-md bg-gold px-4 py-2 text-ink font-medium">
              Send
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
