import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign up',
  description: 'Create a free Birrly account and start trading USDT for Ethiopian Birr peer to peer.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
