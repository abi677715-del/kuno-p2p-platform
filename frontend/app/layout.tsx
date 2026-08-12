import type { Metadata, Viewport } from 'next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AutoLogout from '../components/AutoLogout';
import './globals.css';

const SITE_URL = 'https://www.birrly.net';
const TITLE = 'Birrly — Trade USDT for Birr, peer to peer';
const DESCRIPTION = 'A peer-to-peer marketplace to exchange USDT and Ethiopian Birr, with escrow-protected trades.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  keywords: ['USDT', 'Ethiopian Birr', 'ETB', 'peer to peer', 'crypto exchange', 'Ethiopia', 'escrow', 'P2P trading'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Birrly',
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: 'Birrly',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Birrly — Trade USDT for Birr' }],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/og-image.png'],
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
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#0F1420" />
        <script
          dangerouslySetInnerHTML={{
            __html: `try { if (localStorage.getItem('theme') === 'light') document.documentElement.classList.add('light'); } catch (e) {}`,
          }}
        />
      </head>
      <body className="font-body">
          <Header />
        <AutoLogout />
        {children}
        <Footer />
      </body>
    </html>
  );
}
