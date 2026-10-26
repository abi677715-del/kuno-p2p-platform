import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Log in',
  description: 'Log in to your Birrly account to trade USDT and Birr.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
