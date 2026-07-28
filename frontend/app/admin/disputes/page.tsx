'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [expandedTradeId, setExpandedTradeId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messagesError, setMessagesError] = useState('');

  async function load() {
    try {
      setDisputes(await apiFetch('/trades/admin/disputes'));
    } catch (err: any) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleChat(tradeId: string) {
    if (expandedTradeId === tradeId) {
      setExpandedTradeId(null);
      return;
    }
    setExpandedTradeId(tradeId);
    setMessages([]);
    setMessagesError('');
    try {
      setMessages(await apiFetch(`/trades/admin/disputes/${tradeId}/messages`));
    } catch (err: any) {
      setMessagesError(err.message);
    }
  }

  async function resolve(id: string, outcome: 'RELEASE_TO_BUYER' | 'REFUND_TO_SELLER') {
    const resolution = window.prompt('Note on how this was resolved:');
    if (!resolution) return;
    await apiFetch(`/trades/admin/disputes/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ outcome, resolution }),
    });
    load();
  }

  return (
    <main className="min-h-screen bg-ink px-6 py-10 md:px-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-display font-bold text-2xl text-paper mb-6">Dispute resolution center</h1>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <div className="space-y-4">
          {disputes.map((d) => (
            <div key={d.id} className="bg-surface border border-white/10 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-paper font-medium">
                  {d.trade.buyer.email} (buyer) ↔ {d.trade.seller.email} (seller)
                </p>
                <span className="font-mono text-sm text-gold">
                  {d.trade.amountUsdt} USDT / {d.trade.amountEtb} ETB
                </span>
              </div>
              <p className="text-xs text-muted mb-1">Raised by {d.raisedBy.email}</p>
              <p className="text-sm text-paper mb-4">{d.reason}</p>

              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => toggleChat(d.trade.id)}
                  className="rounded-md border border-white/15 px-3 py-1.5 text-teal text-sm font-medium"
                >
                  {expandedTradeId === d.trade.id ? 'Hide chat log' : 'View chat log'}
                </button>
                <button
                  onClick={() => resolve(d.id, 'RELEASE_TO_BUYER')}
                  className="rounded-md bg-gradient-to-br from-gold to-teal px-3 py-1.5 text-ink text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Release to buyer
                </button>
                <button
                  onClick={() => resolve(d.id, 'REFUND_TO_SELLER')}
                  className="rounded-md border border-white/15 px-3 py-1.5 text-paper text-sm font-medium"
                >
                  Refund to seller
                </button>
              </div>

              {expandedTradeId === d.trade.id && (
                <div className="mt-4 bg-surfaceRaised rounded-lg p-4 max-h-72 overflow-y-auto space-y-2">
                  {messagesError && <p className="text-red-400 text-xs">{messagesError}</p>}
                  {messages.map((m) => (
                    <div key={m.id} className="text-sm">
                      <span className="text-muted font-mono text-xs">
                        {m.sender?.email ?? m.senderId} · {new Date(m.createdAt).toLocaleString()}
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
                    </div>
                  ))}
                  {messages.length === 0 && !messagesError && (
                    <p className="text-muted text-xs">No messages were exchanged on this trade.</p>
                  )}
                </div>
              )}
            </div>
          ))}
          {disputes.length === 0 && !error && <p className="text-muted text-sm">No open disputes.</p>}
        </div>
      </div>
    </main>
  );
}
