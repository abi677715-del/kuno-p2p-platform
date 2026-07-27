const columns = [
  {
    title: 'Product',
    links: [
      { href: '/marketplace', label: 'Marketplace' },
      { href: '/trades', label: 'Trades' },
      { href: '/wallet', label: 'Wallet' },
      { href: '/support', label: 'Support' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About' },
      { href: '/support', label: 'Contact us' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/terms', label: 'Terms of Service' },
      { href: '/privacy', label: 'Privacy Policy' },
      { href: '/risk-disclosure', label: 'Risk Disclosure' },
    ],
  },
];

export default function Footer() {
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
          <strong className="text-paper/70">Risk disclaimer:</strong> Trading cryptocurrency involves significant
          risk and may not be suitable for everyone. Prices can be volatile, and you may lose some or all of your
          funds. Birrly is a peer-to-peer marketplace that facilitates trades between users and holds funds in
          escrow only for the duration of an active trade — it does not provide investment advice. Please trade
          responsibly and only with funds you can afford to lose.
        </p>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-6 border-t border-white/10">
          <p className="text-xs text-muted">© {new Date().getFullYear()} Birrly. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
