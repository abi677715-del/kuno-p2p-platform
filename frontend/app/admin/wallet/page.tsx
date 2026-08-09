'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API can be blocked (e.g. insecure context) — fail silently, text is still selectable.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="shrink-0 rounded-md border border-white/15 px-2 py-0.5 text-[11px] font-medium text-paper hover:border-white/30 transition-colors"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

export default function AdminWalletPage() {
  const [deposits, setDeposits] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [myEmail, setMyEmail] = useState('');
  const [error, setError] = useState('');
  const [selectedDeposits, setSelectedDeposits] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  async function load() {
    try {
      const [d, w, me] = await Promise.all([
        apiFetch('/wallet/admin/deposits/pending'),
        apiFetch('/wallet/admin/withdrawals/pending'),
        apiFetch('/users/me'),
      ]);
      setDeposits(d);
      setWithdrawals(w);
      setMyEmail(me.email);
      setSelectedDeposits(new Set());
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

  function toggleDepositSelected(id: string) {
    setSelectedDeposits((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function bulkConfirmDeposits() {
    setBulkBusy(true);
    try {
      await apiFetch('/wallet/admin/deposits/bulk-confirm', {
        method: 'POST',
        body: JSON.stringify({ ids: [...selectedDeposits] }),
      });
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBulkBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-ink px-6 py-10 md:px-12">
      <div className="max-w-3xl mx-auto space-y-10">
        <div>
          <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
            <h1 className="font-display font-bold text-2xl text-paper">Pending deposits</h1>
            {selectedDeposits.size > 0 && (
              <button
                onClick={bulkConfirmDeposits}
                disabled={bulkBusy}
                className="rounded-md bg-gradient-to-br from-gold to-teal px-3 py-1.5 text-ink text-sm font-medium disabled:opacity-50"
              >
                Confirm {selectedDeposits.size} selected
              </button>
            )}
          </div>
          <p className="text-xs text-muted mb-4">
            Verify the transaction hash on TronScan before confirming — check the box once verified, or confirm one at a time.
          </p>
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
          <div className="space-y-3">
            {deposits.map((d) => (
              <div key={d.id} className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedDeposits.has(d.id)}
                  onChange={() => toggleDepositSelected(d.id)}
                  className="mt-6"
                />
                <div className="flex-1">
                  <Row
                    code={d.code}
                    email={d.wallet.user.email}
                    amount={d.amount}
                    network={d.network}
                    detail={d.referenceId}
                    detailLabel="tx hash"
                    onConfirm={() => act('deposits', d.id, 'confirm')}
                    onReject={() => act('deposits', d.id, 'reject')}
                  />
                </div>
              </div>
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
            {withdrawals.map((w) => {
              const alreadyApprovedByMe = w.firstApprovedByEmail === myEmail;
              return (
                <Row
                  key={w.id}
                  code={w.code}
                  email={w.wallet.user.email}
                  amount={w.amount}
                  network={w.network}
                  detail={w.referenceId}
                  detailLabel="destination"
                  onConfirm={() => act('withdrawals', w.id, 'confirm')}
                  onReject={() => act('withdrawals', w.id, 'reject')}
                  confirmDisabled={alreadyApprovedByMe}
                  note={
                    w.requiresDualApproval
                      ? w.firstApprovedByEmail
                        ? alreadyApprovedByMe
                          ? 'You already gave the first approval — a different admin must confirm to release funds.'
                          : `First approval given by ${w.firstApprovedByEmail} — your confirm will release the funds.`
                        : 'Large withdrawal — needs two different admins to approve before funds are released.'
                      : undefined
                  }
                />
              );
            })}
            {withdrawals.length === 0 && <p className="text-muted text-sm">Nothing pending.</p>}
          </div>
        </div>
      </div>
    </main>
  );
}

function Row({
  code,
  email,
  amount,
  network,
  detail,
  detailLabel,
  onConfirm,
  onReject,
  note,
  confirmDisabled,
}: {
  code?: string;
  email: string;
  amount: string;
  network?: string;
  detail: string;
  detailLabel: string;
  onConfirm: () => void;
  onReject: () => void;
  note?: string;
  confirmDisabled?: boolean;
}) {
  return (
    <div className="bg-surface border border-white/10 rounded-xl p-5 flex items-center justify-between gap-4">
      <div className="min-w-0 flex-1">
        <p className="text-paper font-medium">{email}</p>
        {code && <p className="font-mono text-xs text-teal">{code}</p>}
        <div className="flex items-center gap-2 mt-0.5">
          <p className="font-mono text-sm text-gold">{amount} USDT</p>
          {network && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-teal/20 text-teal uppercase tracking-wide">
              {network}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-xs text-muted truncate">{detailLabel}: {detail}</p>
          <CopyButton text={detail} />
        </div>
        {note && <p className="text-[11px] text-gold mt-1.5">{note}</p>}
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={onConfirm}
          disabled={confirmDisabled}
          title={confirmDisabled ? 'A different admin must give the second approval' : undefined}
          className="rounded-md bg-gradient-to-br from-gold to-teal px-3 py-1.5 text-ink text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Confirm
        </button>
        <button onClick={onReject} className="rounded-md border border-white/15 px-3 py-1.5 text-paper text-sm font-medium">
          Reject
        </button>
      </div>
    </div>
  );
}
