'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function AdminWalletPage() {
  const [deposits, setDeposits] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [error, setError] = useState('');

  async function load() {
    try {
      const [d, w] = await Promise.all([
        apiFetch('/wallet/admin/deposits/pending'),
        apiFetch('/wallet/admin/withdrawals/pending'),
      ]);
      setDeposits(d);
      setWithdrawals(w);
    } catch (err: any) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function act(kind: 'deposits' | 'withdrawals', id: string, action: 'confirm' | 'reject') {
    await apiFetch(`/wallet/admin/${kind}/${id}/${action}`, { method: 'POST' });
    load();
  }

  return (
    <main className="min-h-screen bg-ink px-6 py-10 md:px-12">
      <div className="max-w-3xl mx-auto space-y-10">
        <div>
          <h1 className="font-display font-bold text-2xl text-paper mb-1">Pending deposits</h1>
          <p className="text-xs text-muted mb-4">Verify the transaction hash on TronScan before confirming.</p>
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
          <div className="space-y-3">
            {deposits.map((d) => (
              <Row
                key={d.id}
                email={d.wallet.user.email}
                amount={d.amount}
                detail={d.referenceId}
                detailLabel="tx hash"
                onConfirm={() => act('deposits', d.id, 'confirm')}
                onReject={() => act('deposits', d.id, 'reject')}
              />
            ))}
            {deposits.length === 0 && <p className="text-muted text-sm">Nothing pending.</p>}
          </div>
        </div>

        <div>
          <h1 className="font-display font-bold text-2xl text-paper mb-1">Pending withdrawals</h1>
          <p className="text-xs text-muted mb-4">
            Send the USDT from the platform wallet manually, then confirm here.
          </p>
          <div className="space-y-3">
            {withdrawals.map((w) => (
              <Row
                key={w.id}
                email={w.wallet.user.email}
                amount={w.amount}
                detail={w.referenceId}
                detailLabel="destination"
                onConfirm={() => act('withdrawals', w.id, 'confirm')}
                onReject={() => act('withdrawals', w.id, 'reject')}
              />
            ))}
            {withdrawals.length === 0 && <p className="text-muted text-sm">Nothing pending.</p>}
          </div>
        </div>
      </div>
    </main>
  );
}

function Row({
  email,
  amount,
  detail,
  detailLabel,
  onConfirm,
  onReject,
}: {
  email: string;
  amount: string;
  detail: string;
  detailLabel: string;
  onConfirm: () => void;
  onReject: () => void;
}) {
  return (
    <div className="bg-surface border border-white/10 rounded-xl p-5 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-paper font-medium">{email}</p>
        <p className="font-mono text-sm text-gold">{amount} USDT</p>
        <p className="text-xs text-muted truncate">{detailLabel}: {detail}</p>
      </div>
      <div className="flex gap-2 shrink-0">
        <button onClick={onConfirm} className="rounded-md bg-teal px-3 py-1.5 text-ink text-sm font-medium">
          Confirm
        </button>
        <button onClick={onReject} className="rounded-md border border-white/15 px-3 py-1.5 text-paper text-sm font-medium">
          Reject
        </button>
      </div>
    </div>
  );
}
