import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'USDT and Birr offers',
  description: 'Live offers to buy and sell USDT for Ethiopian Birr from verified traders, paid by bank or mobile money, protected by escrow.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
