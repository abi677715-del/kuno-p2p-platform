import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/dashboard', '/wallet', '/trades', '/profile', '/settings', '/kyc', '/notifications'],
      },
    ],
    sitemap: 'https://www.birrly.net/sitemap.xml',
  };
}
