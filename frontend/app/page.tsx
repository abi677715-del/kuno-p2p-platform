'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { PAYMENT_METHODS, colorFor, initialsFor } from '@/lib/paymentMethods';
import AnimatedBackground from '@/components/AnimatedBackground';

const FALLBACK_RATE = 123.4; // used until the live rate loads, or if it fails to load
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export default function LandingPage() {
  const [usdt, setUsdt] = useState('100');
  const [rate, setRate] = useState(FALLBACK_RATE);
  const [rateSampleSize, setRateSampleSize] = useState(0);

  useEffect(() => {
    fetch(`${API_URL}/ads/rate`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.rate) {
          setRate(data.rate);
          setRateSampleSize(data.sampleSize ?? 0);
        }
      })
      .catch(() => {});
  }, []);

  const etb = useMemo(() => {
    const n = parseFloat(usdt);
    if (Number.isNaN(n)) return '0.00';
    return (n * rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, [usdt, rate]);

  return (
    <main className="overflow-x-hidden">
      <AnimatedBackground />
      <div className="relative z-10">
        <Nav />
        <Hero usdt={usdt} setUsdt={setUsdt} etb={etb} rate={rate} isLive={rateSampleSize > 0} />
        <HowItWorks />
        <Trust />
        <Cta />
        <Footer />
      </div>
    </main>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-ink/70 border-b border-white/5">
      <div className="flex items-center justify-between px-6 py-4 md:px-12 max-w-6xl mx-auto">
        <a href="/" className="inline-flex items-center">
          <img src="/birrly-logo.png" alt="Birrly" className="h-8 w-auto" />
        </a>
        <div className="flex items-center gap-6 text-sm text-muted">
          <a href="#how" className="hidden sm:inline hover:text-paper transition-colors">
            How it works
          </a>
          <a href="/login" className="hover:text-paper transition-colors">
            Log in
          </a>
          <a
            href="/signup"
            className="rounded-md bg-gradient-to-br from-gold to-teal px-4 py-2 text-onaccent font-medium hover:opacity-90 hover:shadow-lg hover:shadow-teal/20 transition-all"
          >
            Get started
          </a>
        </div>
      </div>
    </header>
  );
}

function Hero({
  usdt,
  setUsdt,
  etb,
  rate,
  isLive,
}: {
  usdt: string;
  setUsdt: (v: string) => void;
  etb: string;
  rate: number;
  isLive: boolean;
}) {
  return (
    <section className="relative px-6 md:px-12 pt-14 pb-24 max-w-6xl mx-auto">
      <div
        className="pointer-events-none absolute -top-24 -left-32 h-80 w-80 rounded-full bg-gold/20 blur-3xl animate-float-orb"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute top-10 -right-24 h-96 w-96 rounded-full bg-teal/20 blur-3xl animate-float-orb"
        style={{ animationDelay: '-7s' }}
        aria-hidden
      />

      <div className="relative grid md:grid-cols-2 gap-12 items-center">
        <div className="animate-fade-in-up">
          <p className="inline-flex items-center gap-2 font-mono text-xs text-teal tracking-widest uppercase mb-5 border border-teal/30 bg-teal/10 rounded-full px-3 py-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-teal animate-pulse" />
            Peer-to-peer · Escrow-protected
          </p>
          <h1 className="font-display font-bold text-4xl md:text-5xl leading-tight text-paper mb-6">
            Trade USDT for Birr, directly with people you can{' '}
            <span className="bg-gradient-to-br from-gold to-teal bg-clip-text text-transparent">trust</span>.
          </h1>
          <p className="text-muted text-lg mb-8 max-w-md">
            Post an offer or take one. Funds sit in escrow until both sides confirm, so a trade
            only completes when the money has actually moved.
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="/signup"
              className="rounded-md bg-gradient-to-br from-gold to-teal px-6 py-3 text-onaccent font-medium hover:opacity-90 hover:shadow-lg hover:shadow-teal/20 hover:-translate-y-0.5 transition-all"
            >
              Create free account
            </a>
            <a
              href="#how"
              className="rounded-md border border-white/15 px-6 py-3 text-paper font-medium hover:border-white/30 hover:-translate-y-0.5 transition-all"
            >
              See how it works
            </a>
          </div>

          <div className="mt-10">
            <p className="text-xs text-muted uppercase tracking-wide mb-3">Pay and get paid your way</p>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_METHODS.slice(0, 6).map((m) => (
                <span
                  key={m.label}
                  title={m.label}
                  className="flex items-center gap-1.5 rounded-full bg-surface border border-white/10 pl-1.5 pr-3 py-1 text-xs text-muted"
                >
                  <span
                    className="flex items-center justify-center h-5 w-5 rounded-full text-[9px] font-bold text-white shrink-0"
                    style={{ backgroundColor: colorFor(m.label) }}
                  >
                    {initialsFor(m.label)}
                  </span>
                  {m.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div
          className="bg-surface border border-white/10 rounded-2xl p-6 md:p-8 animate-fade-in-up shadow-2xl shadow-black/20"
          style={{ animationDelay: '0.1s' }}
        >
          <p className="text-sm text-muted mb-4 flex items-center gap-2">
            {isLive && <span className="inline-block h-1.5 w-1.5 rounded-full bg-teal animate-pulse" />}
            {isLive ? 'Live rate — median of active offers' : 'Indicative rate — actual price set by each trader\'s offer'}
          </p>
          <div className="flex items-center gap-3 mb-2">
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
          <div className="flex justify-center -my-1 relative z-10">
            <span className="flex items-center justify-center h-8 w-8 rounded-full bg-ink border border-white/10 text-muted text-sm">
              ↓
            </span>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex-1 bg-surfaceRaised rounded-lg px-4 py-3">
              <label className="text-xs text-muted block mb-1">You receive</label>
              <div className="flex items-center gap-2">
                <span className="font-mono text-2xl text-paper">{etb}</span>
                <span className="text-gold font-medium">ETB</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted mt-4 font-mono">1 USDT ≈ {rate} ETB</p>
        </div>
      </div>
    </section>
  );
}

function StepIcon({ n }: { n: string }) {
  return (
    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-gold/20 to-teal/20 border border-white/10 font-mono text-sm text-teal">
      {n}
    </span>
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
      body: 'The seller’s USDT is locked the moment a trade starts — it can’t be withdrawn mid-trade.',
    },
    {
      n: '03',
      title: 'Pay and confirm',
      body: 'The buyer sends Birr by bank or mobile money, then marks the trade as paid in the trade room.',
    },
    {
      n: '04',
      title: 'Escrow releases automatically',
      body: 'Once the seller confirms payment, escrow releases USDT to the buyer’s wallet.',
    },
  ];

  return (
    <Reveal id="how" className="px-6 md:px-12 py-20 max-w-6xl mx-auto">
      <h2 className="font-display font-bold text-2xl text-paper mb-2">How a trade works</h2>
      <p className="text-muted mb-10 max-w-lg">Four steps, and escrow removes the point where trust used to be required.</p>
      <div className="grid md:grid-cols-4 gap-5">
        {steps.map((s) => (
          <div
            key={s.n}
            className="bg-surface border border-white/10 rounded-xl p-5 hover:border-white/20 hover:-translate-y-1 transition-all"
          >
            <StepIcon n={s.n} />
            <h3 className="font-display font-medium text-paper mt-4 mb-2">{s.title}</h3>
            <p className="text-sm text-muted leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>
    </Reveal>
  );
}

const TRUST_ICONS: Record<string, JSX.Element> = {
  'ID verification': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-5 w-5">
      <circle cx="12" cy="8" r="3.25" />
      <path d="M5.5 20c1.4-3.4 4-5 6.5-5s5.1 1.6 6.5 5" strokeLinecap="round" />
    </svg>
  ),
  'Escrow-held funds': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-5 w-5">
      <rect x="4.5" y="10.5" width="15" height="9.5" rx="1.5" />
      <path d="M7.5 10.5V7.5a4.5 4.5 0 0 1 9 0v3" strokeLinecap="round" />
    </svg>
  ),
  'Dispute resolution': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-5 w-5">
      <path d="M12 3.5c3.5 1.5 6 1.75 6 1.75v6c0 4.5-2.75 7-6 8.75-3.25-1.75-6-4.25-6-8.75v-6s2.5-.25 6-1.75Z" strokeLinejoin="round" />
      <path d="M9.25 12l2 2 3.5-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

function Trust() {
  const points = [
    { label: 'ID verification', body: 'Every trader completes KYC before their first trade.' },
    { label: 'Escrow-held funds', body: 'USDT is locked in escrow for the full duration of the trade.' },
    { label: 'Dispute resolution', body: 'A support team reviews any disagreement using the trade chat log.' },
  ];
  return (
    <Reveal className="px-6 md:px-12 py-20 max-w-6xl mx-auto border-t border-white/10">
      <h2 className="font-display font-bold text-2xl text-paper mb-10">Built so trust isn't the risky part</h2>
      <div className="grid md:grid-cols-3 gap-8">
        {points.map((p) => (
          <div key={p.label}>
            <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-teal/10 text-teal mb-3">
              {TRUST_ICONS[p.label]}
            </span>
            <h3 className="font-display font-medium text-paper mb-2">{p.label}</h3>
            <p className="text-sm text-muted leading-relaxed">{p.body}</p>
          </div>
        ))}
      </div>
    </Reveal>
  );
}

function Cta() {
  return (
    <Reveal className="relative px-6 md:px-12 py-20 max-w-6xl mx-auto text-center overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-64 w-64 rounded-full bg-gradient-to-br from-gold/15 to-teal/15 blur-3xl"
        aria-hidden
      />
      <div className="relative">
        <h2 className="font-display font-bold text-3xl text-paper mb-4">Start your first trade</h2>
        <p className="text-muted mb-8">Verification takes a few minutes. Your first trade can happen today.</p>
        <a
          href="/signup"
          className="inline-block rounded-md bg-gradient-to-br from-gold to-teal px-8 py-3 text-onaccent font-medium hover:opacity-90 hover:shadow-lg hover:shadow-teal/20 hover:-translate-y-0.5 transition-all"
        >
          Create free account
        </a>
      </div>
    </Reveal>
  );
}

function Footer() {
  return (
    <footer className="px-6 md:px-12 py-10 max-w-6xl mx-auto border-t border-white/10">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <a href="/" className="inline-flex items-center">
          <img src="/birrly-logo.png" alt="Birrly" className="h-6 w-auto opacity-80" />
        </a>
        <div className="flex items-center gap-6 text-sm text-muted">
          <a href="#how" className="hover:text-paper transition-colors">
            How it works
          </a>
          <a href="/login" className="hover:text-paper transition-colors">
            Log in
          </a>
          <a href="/signup" className="hover:text-paper transition-colors">
            Sign up
          </a>
        </div>
        <p className="text-xs text-muted">© {new Date().getFullYear()} Birrly</p>
      </div>
    </footer>
  );
}

function Reveal({ children, className, id }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section id={id} ref={ref} className={`reveal ${visible ? 'reveal-in' : ''} ${className ?? ''}`}>
      {children}
    </section>
  );
}
