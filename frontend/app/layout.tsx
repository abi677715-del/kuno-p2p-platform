import type { Metadata, Viewport } from 'next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './globals.css';

export const metadata: Metadata = {
  title: 'Birrly — Trade USDT for Birr, peer to peer',
  description: 'A peer-to-peer marketplace to exchange USDT and Ethiopian Birr, with escrow-protected trades.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Birrly',
  },
};

export const viewport: Viewport = {
  themeColor: '#0F1420',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body">
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
