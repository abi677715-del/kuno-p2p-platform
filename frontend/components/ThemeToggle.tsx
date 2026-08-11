'use client';

import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [light, setLight] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLight(document.documentElement.classList.contains('light'));
    setReady(true);
  }, []);

  function toggle() {
    const next = !light;
    setLight(next);
    document.documentElement.classList.toggle('light', next);
    localStorage.setItem('theme', next ? 'light' : 'dark');
  }

  if (!ready) return <span className="h-8 w-8 shrink-0" />;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={light ? 'Switch to dark mode' : 'Switch to light mode'}
      title={light ? 'Switch to dark mode' : 'Switch to light mode'}
      className="h-8 w-8 shrink-0 rounded-full border border-white/15 flex items-center justify-center text-sm hover:border-white/30 transition-colors"
    >
      {light ? '🌙' : '☀️'}
    </button>
  );
}
