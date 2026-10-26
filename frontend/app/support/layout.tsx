import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Support',
  description: 'Get help with an account, a trade or a payment on Birrly.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
