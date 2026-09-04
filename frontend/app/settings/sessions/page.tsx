'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

type LoginEvent = {
  id: string;
  device: string;
  ipAddress: string | null;
  createdAt: string;
};

export default function SessionsPage() {
  const [events, setEvents] = useState<LoginEvent[]>([]);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    apiFetch('/users/me/login-activity')
      .then(setEvents)
      .catch((err) => setError(err.message));
  }, []);

  async function logoutAll() {
    setLoggingOut(true);
    setError('');
    try {
      await apiFetch('/auth/logout-all', { method: 'POST' });
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    } catch (err: any) {
      setError(err.message);
      setLoggingOut(false);
    }
  }

  return (
    <main className="min-h-screen bg-ink px-6 py-10 md:px-12">
      <div className="max-w-xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="font-display font-bold text-2xl text-paper">Login activity</h1>
          <a href="/profile" className="text-sm text-teal hover:underline">
            Back to profile
          </a>
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="bg-surface border border-white/10 rounded-xl p-6 space-y-3">
          <h2 className="font-display font-medium text-paper">Recent logins</h2>
          <p className="text-xs text-muted">
            The last {events.length || ''} times this account was logged into, with the device and
            IP address used.
          </p>
          <div className="space-y-2">
            {events.map((e) => (
              <div key={e.id} className="flex items-center justify-between bg-surfaceRaised rounded-md px-3 py-2">
                <div>
                  <p className="text-sm text-paper">{e.device}</p>
                  <p className="text-xs text-muted font-mono">{e.ipAddress ?? 'Unknown IP'}</p>
                </div>
                <p className="text-xs text-muted">{new Date(e.createdAt).toLocaleString()}</p>
              </div>
            ))}
            {events.length === 0 && !error && <p className="text-sm text-muted">No login activity yet.</p>}
          </div>
        </div>

        <div className="bg-surface border border-red-400/30 rounded-xl p-6 space-y-3">
          <h2 className="font-display font-medium text-paper">Log out of all devices</h2>
          <p className="text-xs text-muted">
            If you don't recognize a login above, or a device might be compromised, this immediately
            signs out every device — including this one. You'll need to log back in here too.
          </p>
          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              className="text-sm text-red-400 border border-red-400/30 rounded-md px-4 py-2 hover:bg-red-400/10 transition-colors"
            >
              Log out everywhere
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={logoutAll}
                disabled={loggingOut}
                className="text-sm text-onaccent bg-red-400 rounded-md px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {loggingOut ? 'Logging out…' : 'Yes, log out everywhere'}
              </button>
              <button
                onClick={() => setConfirming(false)}
                disabled={loggingOut}
                className="text-sm text-muted hover:text-paper"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
