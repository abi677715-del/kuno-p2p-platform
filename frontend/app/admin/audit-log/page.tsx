'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

type LogEntry = {
  id: string;
  adminEmail: string;
  action: string;
  targetId: string | null;
  createdAt: string;
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/admin/audit-log')
      .then(setLogs)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <main className="min-h-screen bg-ink px-6 py-10 md:px-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-display font-bold text-2xl text-paper mb-2">Admin audit log</h1>
        <p className="text-sm text-muted mb-6">A record of sensitive admin actions — KYC decisions, dispute resolutions, and support tickets.</p>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="bg-surface border border-white/10 rounded-lg p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-paper font-medium">{log.action}</span>
                <span className="text-xs text-muted font-mono">{new Date(log.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-xs text-muted">
                by {log.adminEmail}
                {log.targetId && <> · target: {log.targetId}</>}
              </p>
            </div>
          ))}
          {logs.length === 0 && !error && <p className="text-muted text-sm">No audit entries yet.</p>}
        </div>
      </div>
    </main>
  );
}
