import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Advertise on Birrly',
  description: 'Show your banner to people trading USDT and Birr in Ethiopia.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
