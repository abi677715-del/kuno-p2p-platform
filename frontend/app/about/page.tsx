export default function AboutPage() {
  return (
    <main className="min-h-screen bg-ink px-6 py-10 md:px-12">
      <div className="max-w-2xl mx-auto prose-sm">
        <h1 className="font-display font-bold text-2xl text-paper mb-6">About Birrly</h1>
        <div className="space-y-4 text-sm text-muted leading-relaxed">
          <p>
            Birrly is a peer-to-peer marketplace that lets people in Ethiopia exchange USDT for Ethiopian Birr
            directly with one another, without a centralized order book.
          </p>
          <p>
            When you start a trade, the seller's USDT is locked in escrow before any Birr changes hands. Funds are
            only released once the seller confirms payment, or once our team resolves a dispute — so neither side
            has to trust the other blindly.
          </p>
          <p>
            We charge a small commission (currently 2%) on the USDT side of a trade only when it completes
            successfully. There's no fee for posting an offer, browsing the marketplace, or a trade that gets
            cancelled.
          </p>
          <p>
            Birrly is an early-stage product. If you run into issues or have feedback, please reach out through our{' '}
            <a href="/support" className="text-teal hover:underline">
              Support page
            </a>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
