'use client';

import { useMemo, useState } from 'react';

const INDICATIVE_RATE = 123.4; // ETB per 1 USDT — replace with live market data feed

export default function LandingPage() {
  const [usdt, setUsdt] = useState('100');

  const etb = useMemo(() => {
    const n = parseFloat(usdt);
    if (Number.isNaN(n)) return '0.00';
    return (n * INDICATIVE_RATE).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, [usdt]);

  return (
    <main>
      <Nav />
      <Hero usdt={usdt} setUsdt={setUsdt} etb={etb} />
      <HowItWorks />
      <Trust />
      <Cta />
      <Footer />
    </main>
  );
}

function Nav() {
  return (
    <header className="flex items-center justify-between px-6 py-5 md:px-12 max-w-6xl mx-auto">
      <span className="font-display font-bold text-xl tracking-tight text-paper">
        Birr<span className="text-gold">ly</span>
      </span>
      <div className="flex items-center gap-6 text-sm text-muted">
        <a href="#how" className="hover:text-paper transition-colors">
          How it works
        </a>
        <a href="/login" className="hover:text-paper transition-colors">
          Log in
        </a>
        <a
          href="/signup"
          className="rounded-md bg-teal px-4 py-2 text-ink font-medium hover:bg-teal/90 transition-colors"
        >
          Get started
        </a>
      </div>
    </header>
  );
}

function Hero({
  usdt,
  setUsdt,
  etb,
}: {
  usdt: string;
  setUsdt: (v: string) => void;
  etb: string;
}) {
  return (
    <section className="px-6 md:px-12 pt-10 pb-24 max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
      <div>
        <p className="font-mono text-xs text-teal tracking-widest uppercase mb-4">
          Peer-to-peer · Escrow-protected
        </p>
        <h1 className="font-display font-bold text-4xl md:text-5xl leading-tight text-paper mb-6">
          Trade USDT for Birr, directly with people you can trust.
        </h1>
        <p className="text-muted text-lg mb-8 max-w-md">
          Post an offer or take one. Funds sit in escrow until both sides confirm, so a trade
          only completes when the money has actually moved.
        </p>
        <div className="flex gap-4">
          <a
            href="/signup"
            className="rounded-md bg-gold px-6 py-3 text-ink font-medium hover:bg-gold/90 transition-colors"
          >
            Create free account
          </a>
          <a
            href="#how"
            className="rounded-md border border-white/15 px-6 py-3 text-paper font-medium hover:border-white/30 transition-colors"
          >
            See how it works
          </a>
        </div>
      </div>

      <div className="bg-surface border border-white/10 rounded-2xl p-6 md:p-8">
        <p className="text-sm text-muted mb-4">Indicative rate — actual price set by each trader's offer</p>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 bg-surfaceRaised rounded-lg px-4 py-3">
            <label className="text-xs text-muted block mb-1">You send</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={usdt}
                onChange={(e) => setUsdt(e.target.value)}
                className="bg-transparent font-mono text-2xl text-paper w-full outline-none"
              />
              <span className="text-teal font-medium">USDT</span>
            </div>
          </div>
        </div>
        <div className="flex justify-center text-muted mb-4">↓</div>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-surfaceRaised rounded-lg px-4 py-3">
            <label className="text-xs text-muted block mb-1">You receive</label>
            <div className="flex items-center gap-2">
              <span className="font-mono text-2xl text-paper">{etb}</span>
              <span className="text-gold font-medium">ETB</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted mt-4 font-mono">1 USDT ≈ {INDICATIVE_RATE} ETB</p>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: '01',
      title: 'Post or accept an offer',
      body: 'Browse offers from verified traders, or list your own rate and payment method.',
    },
    {
      n: '02',
      title: 'Funds move into escrow',
      body: 'The seller\u2019s USDT is locked the moment a trade starts — it can\u2019t be withdrawn mid-trade.',
    },
    {
      n: '03',
      title: 'Pay and confirm',
      body: 'The buyer sends Birr by bank or mobile money, then marks the trade as paid in the trade room.',
    },
    {
      n: '04',
      title: 'Escrow releases automatically',
      body: 'Once the seller confirms payment, escrow releases USDT to the buyer\u2019s wallet.',
    },
  ];

  return (
    <section id="how" className="px-6 md:px-12 py-20 max-w-6xl mx-auto">
      <h2 className="font-display font-bold text-2xl text-paper mb-2">How a trade works</h2>
      <p className="text-muted mb-10 max-w-lg">Four steps, and escrow removes the point where trust used to be required.</p>
      <div className="grid md:grid-cols-4 gap-6">
        {steps.map((s) => (
          <div key={s.n} className="border-t border-white/10 pt-4">
            <span className="font-mono text-xs text-teal">{s.n}</span>
            <h3 className="font-display font-medium text-paper mt-2 mb-2">{s.title}</h3>
            <p className="text-sm text-muted leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Trust() {
  const points = [
    { label: 'ID verification', body: 'Every trader completes KYC before their first trade.' },
    { label: 'Escrow-held funds', body: 'USDT is locked in escrow for the full duration of the trade.' },
    { label: 'Dispute resolution', body: 'A support team reviews any disagreement using the trade chat log.' },
  ];
  return (
    <section className="px-6 md:px-12 py-20 max-w-6xl mx-auto border-t border-white/10">
      <h2 className="font-display font-bold text-2xl text-paper mb-10">Built so trust isn't the risky part</h2>
      <div className="grid md:grid-cols-3 gap-8">
        {points.map((p) => (
          <div key={p.label}>
            <h3 className="font-display font-medium text-teal mb-2">{p.label}</h3>
            <p className="text-sm text-muted leading-relaxed">{p.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Cta() {
  return (
    <section className="px-6 md:px-12 py-20 max-w-6xl mx-auto text-center">
      <h2 className="font-display font-bold text-3xl text-paper mb-4">Start your first trade</h2>
      <p className="text-muted mb-8">Verification takes a few minutes. Your first trade can happen today.</p>
      <a
        href="/signup"
        className="inline-block rounded-md bg-gold px-8 py-3 text-ink font-medium hover:bg-gold/90 transition-colors"
      >
        Create free account
      </a>
    </section>
  );
}

function Footer() {
  return (
    <footer className="px-6 md:px-12 py-10 max-w-6xl mx-auto border-t border-white/10 text-sm text-muted flex justify-between">
      <span>Birrly</span>
      <span>Not a bank. USDT and ETB trades happen directly between users.</span>
    </footer>
  );
}
