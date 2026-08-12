import type { MetadataRoute } from 'next';

const BASE_URL = 'https://www.birrly.net';

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    { path: '/', priority: 1 },
    { path: '/marketplace', priority: 0.9 },
    { path: '/about', priority: 0.6 },
    { path: '/login', priority: 0.5 },
    { path: '/signup', priority: 0.5 },
    { path: '/terms', priority: 0.3 },
    { path: '/privacy', priority: 0.3 },
    { path: '/risk-disclosure', priority: 0.3 },
  ];

  return pages.map(({ path, priority }) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
    priority,
  }));
}
