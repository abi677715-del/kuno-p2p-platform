'use client';

import AdBanner from './AdBanner';
import { useLanguage, format } from '@/lib/i18n/context';

export default function Footer() {
  const { t } = useLanguage();

  const columns = [
    {
      title: t.footer.productTitle,
      links: [
        { href: '/marketplace', label: t.footer.marketplace },
        { href: '/trades', label: t.footer.trades },
        { href: '/wallet', label: t.footer.wallet },
        { href: '/support', label: t.footer.support },
      ],
    },
    {
      title: t.footer.companyTitle,
      links: [
        { href: '/about', label: t.footer.about },
        { href: '/support', label: t.footer.contactUs },
        { href: '/advertise', label: t.footer.advertise },
      ],
    },
    {
      title: t.footer.legalTitle,
      links: [
        { href: '/terms', label: t.footer.terms },
        { href: '/privacy', label: t.footer.privacy },
        { href: '/risk-disclosure', label: t.footer.riskDisclosure },
      ],
    },
  ];

  return (
    <footer className="bg-ink border-t border-white/10 mt-16">
      <div className="max-w-6xl mx-auto px-6 py-12 md:px-12">
        <img src="/birrly-logo.png" alt="Birrly" className="h-7 w-auto mb-8" />

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 mb-10">
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs uppercase tracking-wide text-muted mb-3">{col.title}</h3>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <a href={link.href} className="text-sm text-paper/80 hover:text-paper transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted leading-relaxed mb-6 max-w-3xl">
          <strong className="text-paper/70">{t.footer.riskLabel}</strong> {t.footer.riskBody}
        </p>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-6 border-t border-white/10">
          <p className="text-xs text-muted">{format(t.footer.copyright, { year: new Date().getFullYear() })}</p>
        </div>
      </div>

      <AdBanner />
    </footer>
  );
}
