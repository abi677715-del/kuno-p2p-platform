'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function WalletPage() {
  const [wallets, setWallets] = useState<any[]>([]);
  const [depositInfo, setDepositInfo] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [error, setError] = useState('');

  async function loadAll() {
    try {
      const [w, d, t] = await Promise.all([
        apiFetch('/wallet/balance'),
        apiFetch('/wallet/deposit-address'),
        apiFetch('/wallet/transactions'),
      ]);
      setWallets(w);
      setDepositInfo(d);
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
          {wallets.map((w) => (
            <div key={w.id} className="bg-surface border border-white/10 rounded-xl p-5">
              <p className="text-xs text-muted mb-1">{w.currency}</p>
              <p className="font-mono text-xl text-paper">{w.balance}</p>
              {parseFloat(w.lockedBalance) > 0 && (
                <p className="text-xs text-gold mt-1">{w.lockedBalance} in escrow</p>
              )}
            </div>
          ))}
        </div>

        {depositInfo && <DepositCard depositInfo={depositInfo} onSubmitted={loadAll} />}

        <WithdrawCard onSubmitted={loadAll} />

        <div className="bg-surface border border-white/10 rounded-xl p-5">
          <h2 className="font-display font-medium text-paper mb-3">Recent activity</h2>
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between text-sm">
                <span className="text-muted">
                  {tx.type} · {new Date(tx.createdAt).toLocaleDateString()}
                </span>
                <span className="font-mono text-paper">{tx.amount}</span>
                <span
                  className={
                    tx.status === 'CONFIRMED' ? 'text-teal text-xs' : tx.status === 'FAILED' ? 'text-red-400 text-xs' : 'text-gold text-xs'
                  }
                >
                  {tx.status}
                </span>
              </div>
            ))}
            {transactions.length === 0 && <p className="text-muted text-sm">No activity yet.</p>}
          </div>
        </div>
      </div>
    </main>
  );
}

function DepositCard({ depositInfo, onSubmitted }: { depositInfo: any; onSubmitted: () => void }) {
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await apiFetch('/wallet/deposit', {
        method: 'POST',
        body: JSON.stringify({ currency: 'USDT', amount, txHash }),
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
      <h2 className="font-display font-medium text-paper mb-3">Deposit USDT (TRC20)</h2>
      <p className="text-xs text-muted mb-3">
        Send USDT to this address, then submit the transaction hash below. Our team confirms it on-chain,
        usually within a few minutes.
      </p>
      <div className="bg-white rounded-lg p-4 mb-3 flex justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={depositInfo.qrCodeDataUrl} alt="Deposit address QR code" width={160} height={160} />
      </div>
      <p className="font-mono text-xs text-paper break-all bg-surfaceRaised rounded-md p-3 mb-4">
        {depositInfo.address}
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
        <button type="submit" className="w-full rounded-md bg-gold py-2 text-ink font-medium">
          Submit deposit
        </button>
      </form>
    </div>
  );
}

function WithdrawCard({ onSubmitted }: { onSubmitted: () => void }) {
  const [amount, setAmount] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await apiFetch('/wallet/withdraw', {
        method: 'POST',
        body: JSON.stringify({ currency: 'USDT', amount, toAddress }),
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
      <h2 className="font-display font-medium text-paper mb-3">Withdraw USDT (TRC20)</h2>
      <p className="text-xs text-muted mb-3">
        Funds are held while our team sends the USDT from the platform wallet, usually within a few hours.
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          placeholder="Amount (USDT)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          className="w-full bg-surfaceRaised rounded-md px-3 py-2 text-paper outline-none focus:ring-2 focus:ring-teal"
        />
        <input
          placeholder="Your TRC20 address"
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
