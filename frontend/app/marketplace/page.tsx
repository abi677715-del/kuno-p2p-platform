'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { PAYMENT_METHODS, colorFor, initialsFor } from '@/lib/paymentMethods';
import { displayName } from '@/lib/displayName';
import { formatAmount } from '@/lib/format';

// The logo's diagonal gold-to-teal gradient, reused as the "active" look for
// every toggle/tab control so selection state reads as on-brand, not generic.
const TOGGLE_ACTIVE = 'bg-gradient-to-br from-gold to-teal text-onaccent';

type Ad = {
  id: string;
  side: 'BUY' | 'SELL';
  priceEtb: string;
  effectivePriceEtb?: string;
  pricingMode?: 'FIXED' | 'FLOATING';
  marginPercent?: string | null;
  minLimitEtb: string;
  maxLimitEtb: string;
  paymentMethods: string[];
  description?: string;
  user: {
    id: string;
    fullName?: string;
    lastSeenAt?: string;
    completedTrades?: number;
    completionRate?: number | null;
    tier?: string | null;
    isMerchant?: boolean;
    avgReleaseMinutes?: number | null;
    avgRating?: number | null;
    ratingCount?: number;
  };
};

const ONLINE_WINDOW_MS = 5 * 60 * 1000;

function isOnline(lastSeenAt?: string) {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() < ONLINE_WINDOW_MS;
}

function lastSeenLabel(lastSeenAt?: string) {
  if (!lastSeenAt) return 'Offline';
  const minutes = Math.floor((Date.now() - new Date(lastSeenAt).getTime()) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const TIER_COLOR: Record<string, string> = {
  'Top Merchant': 'bg-gold/20 text-gold',
  Verified: 'bg-teal/20 text-teal',
  Trader: 'bg-white/10 text-muted',
};

function MerchantBadges({ user }: { user: Ad['user'] }) {
  return (
    <span className="flex items-center gap-1.5">
      {user.isMerchant && (
        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-teal/20 text-teal" title="Verified merchant — 1% trade fee">
          Merchant
        </span>
      )}
      {user.tier && (
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${TIER_COLOR[user.tier] ?? 'bg-white/10 text-muted'}`}>
          {user.tier}
        </span>
      )}
      {user.avgRating !== null && user.avgRating !== undefined && (
        <span className="text-[11px] text-gold" title={`${user.ratingCount} rating${user.ratingCount === 1 ? '' : 's'}`}>
          ★ {user.avgRating} ({user.ratingCount})
        </span>
      )}
      {user.completionRate !== null && user.completionRate !== undefined && (
        <span className="text-[11px] text-muted">
          {user.completionRate}% · {user.completedTrades} trades
        </span>
      )}
      {user.avgReleaseMinutes !== null && user.avgReleaseMinutes !== undefined && (
        <span className="text-[11px] text-muted">· avg release {user.avgReleaseMinutes}m</span>
      )}
    </span>
  );
}

type Trade = {
  id: string;
  status: string;
  amountUsdt: string;
  amountEtb: string;
  buyer: { fullName?: string };
  seller: { fullName?: string };
};

const ENDED_STATUSES = ['COMPLETED', 'DISPUTED', 'CANCELLED'];

const TRADE_STATUS_COLOR: Record<string, string> = {
  COMPLETED: 'text-teal',
  DISPUTED: 'text-red-400',
  CANCELLED: 'text-muted',
};

export default function MarketplacePage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState<'BUY' | 'SELL'>('BUY');
  const [methodFilter, setMethodFilter] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minLimit, setMinLimit] = useState('');
  const [merchantOnly, setMerchantOnly] = useState(false);

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
    apiFetch('/trades')
      .then(setTrades)
      .catch(() => {});
  }, []);

  const endedTrades = trades.filter((t) => ENDED_STATUSES.includes(t.status));

  // "Buy" tab shows sellers' offers (side SELL) — that's who you'd buy USDT from.
  // "Sell" tab shows buyers' offers (side BUY) — that's who you'd sell USDT to.
  const minPriceNum = parseFloat(minPrice);
  const maxPriceNum = parseFloat(maxPrice);
  const minLimitNum = parseFloat(minLimit);

  const visibleAds = ads
    .filter((ad) => ad.side === (tab === 'BUY' ? 'SELL' : 'BUY'))
    .filter((ad) => methodFilter.length === 0 || ad.paymentMethods.some((m) => methodFilter.includes(m)))
    .filter((ad) => !merchantOnly || ad.user.isMerchant)
    .filter((ad) => Number.isNaN(minPriceNum) || parseFloat(ad.effectivePriceEtb ?? ad.priceEtb) >= minPriceNum)
    .filter((ad) => Number.isNaN(maxPriceNum) || parseFloat(ad.effectivePriceEtb ?? ad.priceEtb) <= maxPriceNum)
    .filter((ad) => Number.isNaN(minLimitNum) || parseFloat(ad.maxLimitEtb) >= minLimitNum);

  const hasActiveFilters = methodFilter.length > 0 || merchantOnly || minPrice || maxPrice || minLimit;

  function clearAllFilters() {
    setMethodFilter([]);
    setMerchantOnly(false);
    setMinPrice('');
    setMaxPrice('');
    setMinLimit('');
  }

  function toggleMethodFilter(label: string) {
    setMethodFilter((prev) => (prev.includes(label) ? prev.filter((m) => m !== label) : [...prev, label]));
  }

  return (
    <main className="min-h-screen bg-ink px-6 py-10 md:px-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display font-bold text-2xl text-paper">Marketplace</h1>
          <div className="flex items-center gap-3">
            <a href="/marketplace/my-ads" className="text-sm text-teal hover:underline">
              My ads
            </a>
            <button
              onClick={() => setShowForm((v) => !v)}
              className="rounded-md bg-gradient-to-br from-gold to-teal px-4 py-2 text-onaccent font-medium hover:opacity-90 transition-opacity"
            >
              {showForm ? 'Close' : 'Post an offer'}
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-6 bg-surface border border-white/10 rounded-lg p-1 w-fit">
          <button
            onClick={() => setTab('BUY')}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === 'BUY' ? TOGGLE_ACTIVE : 'text-muted hover:text-paper'
            }`}
          >
            Buy USDT
          </button>
          <button
            onClick={() => setTab('SELL')}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === 'SELL' ? TOGGLE_ACTIVE : 'text-muted hover:text-paper'
            }`}
          >
            Sell USDT
          </button>
        </div>

        {showForm && <CreateAdForm onCreated={() => { setShowForm(false); loadAds(); }} />}

        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {PAYMENT_METHODS.map((method) => {
            const active = methodFilter.includes(method.label);
            return (
              <button
                key={method.label}
                onClick={() => toggleMethodFilter(method.label)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                  active ? `border-transparent ${TOGGLE_ACTIVE}` : 'border-white/10 text-muted hover:border-white/25'
                }`}
              >
                <span
                  className="flex items-center justify-center h-4 w-4 rounded-full text-[8px] font-bold text-[#fff]"
                  style={{ backgroundColor: method.color }}
                >
                  {method.initials}
                </span>
                {method.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <input
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="Min price ETB"
            className="w-32 bg-surfaceRaised rounded-md px-3 py-1.5 text-xs text-paper outline-none focus:ring-2 focus:ring-teal"
          />
          <input
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Max price ETB"
            className="w-32 bg-surfaceRaised rounded-md px-3 py-1.5 text-xs text-paper outline-none focus:ring-2 focus:ring-teal"
          />
          <input
            value={minLimit}
            onChange={(e) => setMinLimit(e.target.value)}
            placeholder="Min trade amount ETB"
            className="w-40 bg-surfaceRaised rounded-md px-3 py-1.5 text-xs text-paper outline-none focus:ring-2 focus:ring-teal"
          />
          <label className="flex items-center gap-1.5 text-xs text-muted">
            <input type="checkbox" checked={merchantOnly} onChange={(e) => setMerchantOnly(e.target.checked)} />
            Merchants only
          </label>
          {hasActiveFilters && (
            <button onClick={clearAllFilters} className="text-xs text-muted hover:text-paper underline">
              Clear filters
            </button>
          )}
        </div>

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
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className={`inline-block h-1.5 w-1.5 rounded-full ${
                        isOnline(ad.user.lastSeenAt) ? 'bg-teal' : 'bg-muted'
                      }`}
                    />
                    <span
                      className="text-paper font-medium hover:underline"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        window.location.href = `/traders/${ad.user.id}`;
                      }}
                    >
                      {displayName(ad.user)}
                    </span>
                    <span className="text-[11px] text-muted">
                      {isOnline(ad.user.lastSeenAt) ? 'Online' : `Last seen ${lastSeenLabel(ad.user.lastSeenAt)}`}
                    </span>
                  </div>
                  <div className="mt-1">
                    <MerchantBadges user={ad.user} />
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {ad.paymentMethods.map((method) => (
                      <span
                        key={method}
                        title={method}
                        className="flex items-center justify-center h-5 w-5 rounded-full text-[9px] font-bold text-[#fff]"
                        style={{ backgroundColor: colorFor(method) }}
                      >
                        {initialsFor(method)}
                      </span>
                    ))}
                  </div>
                  {ad.description && <p className="text-xs text-muted mt-1.5 max-w-sm">{ad.description}</p>}
                </div>
                <div className="text-right">
                  <p className="font-mono text-lg text-paper">{formatAmount(ad.effectivePriceEtb ?? ad.priceEtb)} ETB</p>
                  {ad.pricingMode === 'FLOATING' && (
                    <p className="text-[10px] text-teal">
                      market {Number(ad.marginPercent) >= 0 ? '+' : ''}
                      {ad.marginPercent}%
                    </p>
                  )}
                  <p className="text-xs text-muted">
                    Limits {formatAmount(ad.minLimitEtb)}–{formatAmount(ad.maxLimitEtb)} ETB
                  </p>
                  <p className="text-xs text-muted">
                    Up to {formatAmount(parseFloat(ad.maxLimitEtb) / parseFloat(ad.effectivePriceEtb ?? ad.priceEtb), 4)} USDT
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

        {endedTrades.length > 0 && (
          <div className="mt-12 pt-8 border-t border-white/10">
            <h2 className="font-display font-medium text-paper mb-4">Your trade history</h2>
            <div className="space-y-3">
              {endedTrades.map((t) => (
                <a
                  key={t.id}
                  href={`/trades/${t.id}`}
                  className="block bg-surface border border-white/10 rounded-xl p-4 hover:border-white/25 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-mono uppercase tracking-wide ${TRADE_STATUS_COLOR[t.status] ?? 'text-muted'}`}>
                      {t.status}
                    </span>
                    <span className="font-mono text-sm text-paper">
                      {formatAmount(t.amountUsdt, 4)} USDT ≈ {formatAmount(t.amountEtb)} ETB
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-1">
                    {displayName(t.buyer)} (buyer) ↔ {displayName(t.seller)} (seller)
                  </p>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function CreateAdForm({ onCreated }: { onCreated: () => void }) {
  const [side, setSide] = useState<'BUY' | 'SELL'>('SELL');
  const [pricingMode, setPricingMode] = useState<'FIXED' | 'FLOATING'>('FIXED');
  const [priceEtb, setPriceEtb] = useState('123.40');
  const [marginPercent, setMarginPercent] = useState('0');
  const [minLimitEtb, setMinLimitEtb] = useState('500');
  const [maxLimitEtb, setMaxLimitEtb] = useState('50000');
  const [paymentMethods, setPaymentMethods] = useState<string[]>(['Telebirr', 'CBE']);
  const [description, setDescription] = useState('');
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/users/me')
      .then((data) => {
        if (data?.defaultPaymentMethods?.length) {
          setPaymentMethods(data.defaultPaymentMethods);
        }
      })
      .catch(() => {});
  }, []);

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
    const minNum = parseFloat(minLimitEtb);
    const maxNum = parseFloat(maxLimitEtb);
    if (!(minNum > 0) || !(maxNum > 0)) {
      setError('Min and max limits must be greater than 0 ETB');
      return;
    }
    if (minNum > maxNum) {
      setError(`Min limit (${minNum} ETB) can't be greater than the max limit (${maxNum} ETB) — swap them or fix the amounts.`);
      return;
    }
    try {
      let effectivePrice = priceEtb;
      if (pricingMode === 'FLOATING') {
        const { rate } = await apiFetch('/ads/rate');
        effectivePrice = (rate * (1 + parseFloat(marginPercent || '0') / 100)).toFixed(4);
      }
      await apiFetch('/ads', {
        method: 'POST',
        body: JSON.stringify({
          side,
          priceEtb: effectivePrice,
          minLimitEtb,
          maxLimitEtb,
          paymentMethods,
          description: description || undefined,
          pricingMode,
          marginPercent: pricingMode === 'FLOATING' ? marginPercent : undefined,
        }),
      });
      if (saveAsDefault) {
        await apiFetch('/users/me', { method: 'PATCH', body: JSON.stringify({ defaultPaymentMethods: paymentMethods }) }).catch(() => {});
      }
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
          className={`flex-1 rounded-md py-2 text-sm font-medium ${side === 'SELL' ? TOGGLE_ACTIVE : 'bg-surfaceRaised text-muted'}`}
        >
          I'm selling USDT
        </button>
        <button
          type="button"
          onClick={() => setSide('BUY')}
          className={`flex-1 rounded-md py-2 text-sm font-medium ${side === 'BUY' ? TOGGLE_ACTIVE : 'bg-surfaceRaised text-muted'}`}
        >
          I'm buying USDT
        </button>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setPricingMode('FIXED')}
          className={`flex-1 rounded-md py-2 text-xs font-medium ${pricingMode === 'FIXED' ? TOGGLE_ACTIVE : 'bg-surfaceRaised text-muted border border-transparent'}`}
        >
          Fixed price
        </button>
        <button
          type="button"
          onClick={() => setPricingMode('FLOATING')}
          className={`flex-1 rounded-md py-2 text-xs font-medium ${pricingMode === 'FLOATING' ? TOGGLE_ACTIVE : 'bg-surfaceRaised text-muted border border-transparent'}`}
        >
          Floating (track market rate)
        </button>
      </div>

      {pricingMode === 'FIXED' ? (
        <Field label="Price per USDT (ETB)" value={priceEtb} onChange={setPriceEtb} />
      ) : (
        <Field
          label="Margin vs. market rate (%) — e.g. 2 for 2% above, -1 for 1% below"
          value={marginPercent}
          onChange={setMarginPercent}
        />
      )}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Min limit (ETB)" value={minLimitEtb} onChange={setMinLimitEtb} />
        <Field label="Max limit (ETB)" value={maxLimitEtb} onChange={setMaxLimitEtb} />
      </div>
      {pricingMode === 'FIXED' && (() => {
        const price = parseFloat(priceEtb);
        const max = parseFloat(maxLimitEtb);
        if (!(price > 0) || isNaN(max)) return null;
        return (
          <p className="text-xs text-muted -mt-2">
            Up to {formatAmount(max / price, 4)} USDT at this price
          </p>
        );
      })()}
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
                  selected ? 'border-transparent bg-gradient-to-br from-gold/20 to-teal/20 ring-1 ring-teal' : 'border-white/10 hover:border-white/25'
                }`}
              >
                <span
                  className="flex items-center justify-center h-8 w-8 rounded-full text-[10px] font-bold text-[#fff]"
                  style={{ backgroundColor: method.color }}
                >
                  {method.initials}
                </span>
                <span className="text-[10px] text-muted text-center leading-tight">{method.label}</span>
              </button>
            );
          })}
        </div>
        <label className="flex items-center gap-2 mt-2 text-xs text-muted">
          <input type="checkbox" checked={saveAsDefault} onChange={(e) => setSaveAsDefault(e.target.checked)} />
          Save these as my default payment methods
        </label>
      </div>

      <label className="block">
        <span className="text-xs text-muted block mb-1">Trade description (optional)</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="e.g. Payment terms, response time, notes for the other party…"
          className="w-full bg-surfaceRaised rounded-md px-3 py-2 text-paper outline-none focus:ring-2 focus:ring-teal resize-none"
        />
      </label>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button type="submit" className="w-full rounded-md bg-gradient-to-br from-gold to-teal py-2 text-onaccent font-medium hover:opacity-90 transition-opacity">
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
