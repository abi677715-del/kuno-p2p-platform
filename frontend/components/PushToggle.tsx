'use client';

import { useEffect, useState } from 'react';
import { pushSupported, getCurrentPushSubscription, subscribeToPush, unsubscribeFromPush } from '@/lib/push';

export default function PushToggle() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!pushSupported()) {
      setReady(true);
      return;
    }
    setSupported(true);
    getCurrentPushSubscription()
      .then((sub) => setSubscribed(!!sub))
      .finally(() => setReady(true));
  }, []);

  async function toggle() {
    setError('');
    setBusy(true);
    try {
      if (subscribed) {
        await unsubscribeFromPush();
        setSubscribed(false);
      } else {
        await subscribeToPush();
        setSubscribed(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!ready) return null;

  if (!supported) {
    return <p className="text-xs text-muted">Push notifications aren't supported on this browser.</p>;
  }

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        className={`text-sm font-medium disabled:opacity-50 ${subscribed ? 'text-red-400' : 'text-teal'}`}
      >
        {busy ? 'Working…' : subscribed ? 'Turn off push notifications' : 'Turn on push notifications'}
      </button>
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}
