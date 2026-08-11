'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const EXEMPT_PATHS = ['/', '/login', '/signup', '/forgot-password', '/reset-password', '/verify-email'];

const IDLE_LIMIT_MS = 15 * 60 * 1000;
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];

export default function AutoLogout() {
  const pathname = usePathname();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (EXEMPT_PATHS.includes(pathname)) return;
    if (!localStorage.getItem('accessToken')) return;

    function reset() {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        localStorage.removeItem('accessToken');
        sessionStorage.setItem('loggedOutReason', 'inactivity');
        window.location.href = '/login';
      }, IDLE_LIMIT_MS);
    }

    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, reset, { passive: true }));
    reset();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, reset));
    };
  }, [pathname]);

  return null;
}
