'use client';

import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';

const HIDDEN_ON = ['/', '/login', '/signup'];

export default function Header() {
  const pathname = usePathname();
  if (HIDDEN_ON.includes(pathname)) return null;

  return (
    <header className="px-6 py-4 md:px-12 border-b border-white/10 flex items-center justify-between">
      <a href="/dashboard" className="inline-flex items-center">
        <img src="/birrly-logo.png" alt="Birrly" className="h-8 w-auto" />
      </a>
      <ThemeToggle />
    </header>
  );
}
