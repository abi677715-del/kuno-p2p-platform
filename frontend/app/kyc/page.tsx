'use client';

import { useEffect, useState } from 'react';
import { apiFetch, apiUpload } from '@/lib/api';

export default function KycPage() {
  const [status, setStatus] = useState<any>(null);
  const [idType, setIdType] = useState('National ID');
  const [idNumber, setIdNumber] = useState('');
  const [document, setDocument] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch('/kyc/me').catch(() => null).then(setStatus);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!document || !selfie) {
      setError('Please attach both your ID document and a selfie');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('idType', idType);
      formData.append('idNumber', idNumber);
      formData.append('document', document);
      formData.append('selfie', selfie);
      const result = await apiUpload('/kyc/submit', formData);
      setStatus(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-ink px-6 py-10 flex items-center justify-center">
      <div className="w-full max-w-md bg-surface border border-white/10 rounded-2xl p-8">
        <h1 className="font-display font-bold text-2xl text-paper mb-2">Identity verification</h1>
        <p className="text-sm text-muted mb-6">
          Required before you can post offers or start trades. Reviewed by our team, usually within a day.
        </p>

        {status && (
          <div className="mb-6 rounded-md bg-surfaceRaised px-4 py-3 text-sm">
            <span className="text-muted">Status: </span>
            <span
              className={
                status.status === 'APPROVED'
                  ? 'text-teal'
                  : status.status === 'REJECTED'
                  ? 'text-red-400'
                  : 'text-gold'
              }
            >
              {status.status}
            </span>
          </div>
        )}

        {(!status || status.status === 'REJECTED') && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-xs text-muted block mb-1">ID type</span>
              <select
                value={idType}
                onChange={(e) => setIdType(e.target.value)}
                className="w-full bg-surfaceRaised rounded-md px-3 py-2 text-paper outline-none focus:ring-2 focus:ring-teal"
              >
                <option>National ID</option>
                <option>Passport</option>
                <option>Driver's License</option>
              </select>
            </label>

            <label className="block">
              <span className="text-xs text-muted block mb-1">ID number</span>
              <input
                required
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                className="w-full bg-surfaceRaised rounded-md px-3 py-2 text-paper outline-none focus:ring-2 focus:ring-teal"
              />
            </label>

            <label className="block">
              <span className="text-xs text-muted block mb-1">Photo of your ID</span>
              <input
                type="file"
                accept="image/*,application/pdf"
                required
                onChange={(e) => setDocument(e.target.files?.[0] ?? null)}
                className="w-full text-sm text-muted"
              />
            </label>

            <label className="block">
              <span className="text-xs text-muted block mb-1">Selfie holding your ID</span>
              <input
                type="file"
                accept="image/*"
                required
                onChange={(e) => setSelfie(e.target.files?.[0] ?? null)}
                className="w-full text-sm text-muted"
              />
            </label>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-gold py-3 text-ink font-medium hover:bg-gold/90 transition-colors disabled:opacity-60"
            >
              {loading ? 'Submitting…' : 'Submit for review'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
