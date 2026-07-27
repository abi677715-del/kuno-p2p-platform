'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { PAYMENT_METHODS, colorFor, initialsFor } from '@/lib/paymentMethods';

type Ad = {
  id: string;
  side: 'BUY' | 'SELL';
  priceEtb: string;
  minLimitEtb: string;
  maxLimitEtb: string;
  paymentMethods: string[];
  user: { email: string };
};

export default function MarketplacePage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState<'BUY' | 'SELL'>('BUY');

  async function loadAds() {
    try {
      const data = await apiFetch('/ads');
      setAds(data);
    } catch (err: any) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadAds();
  }, []);

  // "Buy" tab shows sellers' offers (side SELL) — that's who you'd buy USDT from.
  // "Sell" tab shows buyers' offers (side BUY) — that's who you'd sell USDT to.
  const visibleAds = ads.filter((ad) => ad.side === (tab === 'BUY' ? 'SELL' : 'BUY'));

  return (
    <main className="min-h-screen bg-ink px-6 py-10 md:px-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display font-bold text-2xl text-paper">Marketplace</h1>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded-md bg-gold px-4 py-2 text-ink font-medium hover:bg-gold/90 transition-colors"
          >
            {showForm ? 'Close' : 'Post an offer'}
          </button>
        </div>

        <div className="flex gap-2 mb-6 bg-surface border border-white/10 rounded-lg p-1 w-fit">
          <button
            onClick={() => setTab('BUY')}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === 'BUY' ? 'bg-teal text-ink' : 'text-muted hover:text-paper'
            }`}
          >
            Buy USDT
          </button>
          <button
            onClick={() => setTab('SELL')}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === 'SELL' ? 'bg-gold text-ink' : 'text-muted hover:text-paper'
            }`}
          >
            Sell USDT
          </button>
        </div>

        {showForm && <CreateAdForm onCreated={() => { setShowForm(false); loadAds(); }} />}

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <div className="space-y-3">
          {visibleAds.map((ad) => (
            <a
              key={ad.id}
              href={`/marketplace/${ad.id}`}
              className="block bg-surface border border-white/10 rounded-xl p-5 hover:border-white/25 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span
                    className={`text-xs font-mono uppercase tracking-wide ${
                      ad.side === 'SELL' ? 'text-teal' : 'text-gold'
                    }`}
                  >
                    {ad.side === 'SELL' ? 'Selling USDT' : 'Buying USDT'}
                  </span>
                  <p className="text-paper font-medium mt-1">{ad.user.email}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {ad.paymentMethods.map((method) => (
                      <span
                        key={method}
                        title={method}
                        className="flex items-center justify-center h-5 w-5 rounded-full text-[9px] font-bold text-white"
                        style={{ backgroundColor: colorFor(method) }}
                      >
                        {initialsFor(method)}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-lg text-paper">{ad.priceEtb} ETB</p>
                  <p className="text-xs text-muted">
                    Limits {ad.minLimitEtb}–{ad.maxLimitEtb} ETB
                  </p>
                </div>
              </div>
            </a>
          ))}
          {visibleAds.length === 0 && !error && (
            <p className="text-muted text-sm">
              No {tab === 'BUY' ? 'sellers' : 'buyers'} right now — check back soon or post your own offer.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

function CreateAdForm({ onCreated }: { onCreated: () => void }) {
  const [side, setSide] = useState<'BUY' | 'SELL'>('SELL');
  const [priceEtb, setPriceEtb] = useState('123.40');
  const [minLimitEtb, setMinLimitEtb] = useState('500');
  const [maxLimitEtb, setMaxLimitEtb] = useState('50000');
  const [paymentMethods, setPaymentMethods] = useState<string[]>(['Telebirr', 'CBE']);
  const [error, setError] = useState('');

  function toggleMethod(label: string) {
    setPaymentMethods((prev) =>
      prev.includes(label) ? prev.filter((m) => m !== label) : [...prev, label],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (paymentMethods.length === 0) {
      setError('Select at least one payment method');
      return;
    }
    try {
      await apiFetch('/ads', {
        method: 'POST',
        body: JSON.stringify({ side, priceEtb, minLimitEtb, maxLimitEtb, paymentMethods }),
      });
      onCreated();
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface border border-white/10 rounded-xl p-6 mb-8 space-y-4">
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setSide('SELL')}
          className={`flex-1 rounded-md py-2 text-sm font-medium ${side === 'SELL' ? 'bg-teal text-ink' : 'bg-surfaceRaised text-muted'}`}
        >
          I'm selling USDT
        </button>
        <button
          type="button"
          onClick={() => setSide('BUY')}
          className={`flex-1 rounded-md py-2 text-sm font-medium ${side === 'BUY' ? 'bg-gold text-ink' : 'bg-surfaceRaised text-muted'}`}
        >
          I'm buying USDT
        </button>
      </div>

      <Field label="Price per USDT (ETB)" value={priceEtb} onChange={setPriceEtb} />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Min limit (ETB)" value={minLimitEtb} onChange={setMinLimitEtb} />
        <Field label="Max limit (ETB)" value={maxLimitEtb} onChange={setMaxLimitEtb} />
      </div>
      <div>
        <span className="text-xs text-muted block mb-2">Payment methods</span>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {PAYMENT_METHODS.map((method) => {
            const selected = paymentMethods.includes(method.label);
            return (
              <button
                key={method.label}
                type="button"
                onClick={() => toggleMethod(method.label)}
                className={`flex flex-col items-center gap-1 rounded-md py-2 px-1 border transition-colors ${
                  selected ? 'border-teal bg-surfaceRaised' : 'border-white/10 hover:border-white/25'
                }`}
              >
                <span
                  className="flex items-center justify-center h-8 w-8 rounded-full text-[10px] font-bold text-white"
                  style={{ backgroundColor: method.color }}
                >
                  {method.initials}
                </span>
                <span className="text-[10px] text-muted text-center leading-tight">{method.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button type="submit" className="w-full rounded-md bg-gold py-2 text-ink font-medium hover:bg-gold/90 transition-colors">
        Post offer
      </button>
    </form>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs text-muted block mb-1">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-surfaceRaised rounded-md px-3 py-2 text-paper outline-none focus:ring-2 focus:ring-teal"
      />
    </label>
  );
}
