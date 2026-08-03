'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { formatAmount } from '@/lib/format';
import { shortFor } from '@/lib/networks';
import { NetworkIcon } from '@/components/NetworkIcon';

type NetworkOption = { network: string; label: string; withdrawalFeeUsdt?: number };

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API can be blocked (e.g. insecure context) — fail silently, address is still selectable.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="shrink-0 rounded-md border border-white/15 px-2.5 py-1 text-xs font-medium text-paper hover:border-white/30 transition-colors"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

export default function WalletPage() {
  const [wallets, setWallets] = useState<any[]>([]);
  const [networks, setNetworks] = useState<NetworkOption[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [appealingId, setAppealingId] = useState<string | null>(null);
  const [appealedIds, setAppealedIds] = useState<Set<string>>(new Set());

  async function loadAll() {
    try {
      const [w, n, t] = await Promise.all([
        apiFetch('/wallet/balance'),
        apiFetch('/wallet/networks'),
        apiFetch('/wallet/transactions'),
      ]);
      setWallets(w);
      setNetworks(n);
      setTransactions(t);
    } catch (err: any) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  return (
    <main className="min-h-screen bg-ink px-6 py-10 md:px-12">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="font-display font-bold text-2xl text-paper">Wallet</h1>
        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="grid grid-cols-2 gap-4">
          {wallets
            .filter((w) => w.currency === 'USDT')
            .map((w) => (
              <div key={w.id} className="bg-surface border border-white/10 rounded-xl p-5 col-span-2 sm:col-span-1">
                <p className="text-xs text-muted mb-1">{w.currency}</p>
                <p className="font-mono text-xl text-paper">{formatAmount(w.balance, 4)}</p>
                {parseFloat(w.lockedBalance) > 0 && (
                  <p className="text-xs text-gold mt-1">{formatAmount(w.lockedBalance, 4)} in escrow</p>
                )}
              </div>
            ))}
        </div>

        {networks.length > 0 && <DepositCard networks={networks} onSubmitted={loadAll} />}

        {networks.length > 0 && <WithdrawCard networks={networks} onSubmitted={loadAll} />}

        <div className="bg-surface border border-white/10 rounded-xl p-5">
          <h2 className="font-display font-medium text-paper mb-3">Recent activity</h2>
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div key={tx.id} className="border-b border-white/5 last:border-0 pb-2 last:pb-0">
                <div className="flex items-center justify-between text-sm gap-3">
                  <span className="text-muted min-w-0">
                    <span className="block">
                      {tx.type} {tx.network ? `· ${tx.network}` : ''} · {new Date(tx.createdAt).toLocaleDateString()}
                    </span>
                    {tx.code && <span className="block font-mono text-[11px] text-muted/70">{tx.code}</span>}
                  </span>
                  <span className="font-mono text-paper shrink-0">{formatAmount(tx.amount, 4)}</span>
                  <span
                    className={
                      (tx.status === 'CONFIRMED' ? 'text-teal text-xs' : tx.status === 'FAILED' ? 'text-red-400 text-xs' : 'text-gold text-xs') +
                      ' shrink-0'
                    }
                  >
                    {tx.status}
                  </span>
                </div>
                <div className="mt-1">
                  {appealedIds.has(tx.id) ? (
                    <p className="text-[11px] text-teal">Appeal submitted</p>
                  ) : appealingId === tx.id ? (
                    <AppealForm
                      transactionId={tx.id}
                      onCancel={() => setAppealingId(null)}
                      onSubmitted={() => {
                        setAppealedIds((prev) => new Set(prev).add(tx.id));
                        setAppealingId(null);
                      }}
                    />
                  ) : (
                    <button
                      onClick={() => setAppealingId(tx.id)}
                      className="text-[11px] text-muted underline hover:text-paper"
                    >
                      Appeal this transaction
                    </button>
                  )}
                </div>
              </div>
            ))}
            {transactions.length === 0 && <p className="text-muted text-sm">No activity yet.</p>}
          </div>
        </div>
      </div>
    </main>
  );
}

function AppealForm({
  transactionId,
  onCancel,
  onSubmitted,
}: {
  transactionId: string;
  onCancel: () => void;
  onSubmitted: () => void;
}) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setError('');
    setSubmitting(true);
    try {
      await apiFetch('/appeals', {
        method: 'POST',
        body: JSON.stringify({ transactionId, reason }),
      });
      onSubmitted();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-2 space-y-2">
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Explain why you're appealing this transaction..."
        rows={3}
        className="w-full bg-surfaceRaised rounded-md px-3 py-2 text-sm text-paper outline-none focus:ring-2 focus:ring-teal"
      />
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={submitting || reason.trim().length < 10}
          className="text-xs font-medium px-3 py-1.5 rounded bg-gradient-to-br from-gold to-teal text-ink disabled:opacity-50"
        >
          Submit appeal
        </button>
        <button onClick={onCancel} className="text-xs font-medium px-3 py-1.5 rounded border border-white/15 text-paper">
          Cancel
        </button>
      </div>
    </div>
  );
}

function NetworkSelect({
  networks,
  value,
  onChange,
}: {
  networks: NetworkOption[];
  value: string | null;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <span className="text-xs text-muted block mb-2">Network</span>
      <div className="grid grid-cols-4 gap-2">
        {networks.map((n) => {
          const active = n.network === value;
          return (
            <button
              key={n.network}
              type="button"
              onClick={() => onChange(n.network)}
              title={n.label}
              className={`flex flex-col items-center gap-1 rounded-md py-2 px-1 border transition-colors ${
                active ? 'border-transparent bg-gradient-to-br from-gold/20 to-teal/20 ring-1 ring-teal' : 'border-white/10 hover:border-white/25'
              }`}
            >
              <span className="flex items-center justify-center h-8 w-8 rounded-full overflow-hidden">
                <NetworkIcon network={n.network} />
              </span>
              <span className="text-[10px] text-muted text-center leading-tight">{shortFor(n.network)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DepositCard({ networks, onSubmitted }: { networks: NetworkOption[]; onSubmitted: () => void }) {
  const [network, setNetwork] = useState<string | null>(null);
  const [depositInfo, setDepositInfo] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!network) {
      setDepositInfo(null);
      return;
    }
    setDepositInfo(null);
    apiFetch(`/wallet/deposit-address?network=${network}`)
      .then(setDepositInfo)
      .catch((err) => setError(err.message));
  }, [network]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!network) {
      setError('Pick a network first.');
      return;
    }
    try {
      await apiFetch('/wallet/deposit', {
        method: 'POST',
        body: JSON.stringify({ currency: 'USDT', amount, txHash, network }),
      });
      setSuccess(true);
      setAmount('');
      setTxHash('');
      onSubmitted();
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="bg-surface border border-white/10 rounded-xl p-5">
      <h2 className="font-display font-medium text-paper mb-3">Deposit USDT</h2>
      <p className="text-xs text-muted mb-3">
        Pick the network you're sending from, send USDT to the address shown, then submit the transaction
        hash below. Our team confirms it on-chain, usually within a few minutes.
      </p>

      <div className="mb-4">
        <NetworkSelect networks={networks} value={network} onChange={setNetwork} />
      </div>

      {!network && <p className="text-muted text-sm mb-4">Tap a network above to see its deposit address.</p>}

      {network && depositInfo && (
        <>
          <div className="bg-white rounded-lg p-4 mb-3 flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={depositInfo.qrCodeDataUrl} alt="Deposit address QR code" width={160} height={160} />
          </div>
          <div className="flex items-center gap-2 bg-surfaceRaised rounded-md p-3 mb-4">
            <p className="font-mono text-xs text-paper break-all flex-1">{depositInfo.address}</p>
            <CopyButton text={depositInfo.address} />
          </div>

          <p className="text-xs text-muted mb-4">
            No fee from us on deposits — you'll only pay the usual blockchain network fee from your own wallet
            or exchange when sending, same as any other transfer.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              placeholder="Amount sent (USDT)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full bg-surfaceRaised rounded-md px-3 py-2 text-paper outline-none focus:ring-2 focus:ring-teal"
            />
            <input
              placeholder="Transaction hash"
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              required
              className="w-full bg-surfaceRaised rounded-md px-3 py-2 text-paper outline-none focus:ring-2 focus:ring-teal"
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            {success && <p className="text-teal text-sm">Submitted — pending confirmation.</p>}
            <button type="submit" className="w-full rounded-md bg-gradient-to-br from-gold to-teal py-2 text-ink font-medium hover:opacity-90 transition-opacity">
              Submit deposit
            </button>
          </form>
        </>
      )}
    </div>
  );
}

function WithdrawCard({ networks, onSubmitted }: { networks: NetworkOption[]; onSubmitted: () => void }) {
  const [network, setNetwork] = useState(networks[0].network);
  const [amount, setAmount] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const selected = networks.find((n) => n.network === network);
  const fee = selected?.withdrawalFeeUsdt ?? 0;
  const amountNum = parseFloat(amount);
  const netAmount = !Number.isNaN(amountNum) && amountNum > fee ? amountNum - fee : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await apiFetch('/wallet/withdraw', {
        method: 'POST',
        body: JSON.stringify({ currency: 'USDT', amount, toAddress, network }),
      });
      setSuccess(true);
      setAmount('');
      setToAddress('');
      onSubmitted();
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="bg-surface border border-white/10 rounded-xl p-5">
      <h2 className="font-display font-medium text-paper mb-3">Withdraw USDT</h2>
      <p className="text-xs text-muted mb-3">
        Funds are held while our team sends the USDT from the platform wallet, usually within a few hours.
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <NetworkSelect networks={networks} value={network} onChange={setNetwork} />

        {fee > 0 && (
          <p className="text-xs text-gold bg-gold/10 border border-gold/20 rounded-md px-3 py-2">
            Network fee: {formatAmount(fee, 4)} USDT — covers the blockchain gas cost to send your withdrawal.
            {netAmount !== null && ` You'll receive ≈ ${formatAmount(netAmount, 4)} USDT.`}
          </p>
        )}

        <input
          placeholder="Amount (USDT)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          className="w-full bg-surfaceRaised rounded-md px-3 py-2 text-paper outline-none focus:ring-2 focus:ring-teal"
        />
        <input
          placeholder="Your destination address"
          value={toAddress}
          onChange={(e) => setToAddress(e.target.value)}
          required
          className="w-full bg-surfaceRaised rounded-md px-3 py-2 text-paper outline-none focus:ring-2 focus:ring-teal"
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        {success && <p className="text-teal text-sm">Withdrawal requested.</p>}
        <button type="submit" className="w-full rounded-md border border-white/15 py-2 text-paper font-medium">
          Request withdrawal
        </button>
      </form>
    </div>
  );
}
