export default function RiskDisclosurePage() {
  return (
    <main className="min-h-screen bg-ink px-6 py-10 md:px-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-display font-bold text-2xl text-paper mb-2">Risk Disclosure</h1>
        <p className="text-xs text-muted mb-8">Last updated: {new Date().getFullYear()}</p>

        <div className="space-y-6 text-sm text-muted leading-relaxed">
          <section>
            <p>
              Trading cryptocurrency, including USDT, carries real financial risk. Please read this page carefully
              before using Birrly.
            </p>
          </section>

          <section>
            <h2 className="text-paper font-medium mb-2">Price volatility</h2>
            <p>
              Although USDT aims to track the US Dollar, its market price can still fluctuate, and the ETB
              conversion rate you agree on with a counterparty is set by that counterparty, not Birrly. Always
              confirm the price and amount before starting a trade.
            </p>
          </section>

          <section>
            <h2 className="text-paper font-medium mb-2">Counterparty risk</h2>
            <p>
              Birrly connects you directly with another user. While USDT is held in escrow during an active trade
              to protect the fiat side of the transaction, you are still responsible for confirming payment details
              carefully and communicating through the platform's trade chat, not outside channels.
            </p>
          </section>

          <section>
            <h2 className="text-paper font-medium mb-2">Irreversible transactions</h2>
            <p>
              Bank transfers and mobile money payments (like Telebirr) sent outside Birrly cannot be reversed by
              us. If you send fiat payment to the wrong person or account, we cannot guarantee recovery of those
              funds.
            </p>
          </section>

          <section>
            <h2 className="text-paper font-medium mb-2">Not investment advice</h2>
            <p>
              Nothing on Birrly constitutes financial or investment advice. You are solely responsible for your own
              trading decisions.
            </p>
          </section>

          <section>
            <h2 className="text-paper font-medium mb-2">Disputes</h2>
            <p>
              If something goes wrong, raise a dispute from the trade page as soon as possible. Our team reviews
              the full chat history to make a decision, but resolution can take time, and outcomes are not
              guaranteed to favor either party.
            </p>
          </section>

          <section>
            <p>By using Birrly, you acknowledge that you understand and accept these risks.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
