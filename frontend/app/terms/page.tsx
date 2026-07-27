export default function TermsPage() {
  return (
    <main className="min-h-screen bg-ink px-6 py-10 md:px-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-display font-bold text-2xl text-paper mb-2">Terms of Service</h1>
        <p className="text-xs text-muted mb-8">Last updated: {new Date().getFullYear()}</p>

        <div className="space-y-6 text-sm text-muted leading-relaxed">
          <section>
            <h2 className="text-paper font-medium mb-2">1. Acceptance of terms</h2>
            <p>
              By creating an account or using Birrly, you agree to these Terms of Service. If you do not agree,
              please do not use the platform.
            </p>
          </section>

          <section>
            <h2 className="text-paper font-medium mb-2">2. What Birrly does</h2>
            <p>
              Birrly is a peer-to-peer marketplace connecting buyers and sellers of USDT and Ethiopian Birr. We
              facilitate trades and hold USDT in escrow for the duration of an active trade. We are not a bank, and
              we do not custody funds outside of that escrow period.
            </p>
          </section>

          <section>
            <h2 className="text-paper font-medium mb-2">3. Your responsibilities</h2>
            <p>
              You are responsible for the accuracy of information you provide, for completing fiat payments
              honestly and on time, and for keeping your account and 2FA credentials secure. You must not use
              Birrly for money laundering, fraud, or any illegal activity.
            </p>
          </section>

          <section>
            <h2 className="text-paper font-medium mb-2">4. Fees</h2>
            <p>
              A commission (currently 2%) is charged on the USDT side of a trade only when it completes
              successfully. Fees may change; we'll make reasonable efforts to communicate changes in advance.
            </p>
          </section>

          <section>
            <h2 className="text-paper font-medium mb-2">5. Disputes</h2>
            <p>
              If a trade is disputed, our team reviews the chat history between both parties and makes a decision
              to release funds to the buyer or refund the seller. This decision is final.
            </p>
          </section>

          <section>
            <h2 className="text-paper font-medium mb-2">6. Account suspension</h2>
            <p>
              We may suspend or terminate accounts that violate these terms, engage in fraudulent behavior, or pose
              a risk to other users.
            </p>
          </section>

          <section>
            <h2 className="text-paper font-medium mb-2">7. Limitation of liability</h2>
            <p>
              Birrly is provided "as is." We are not liable for losses arising from market volatility, user error,
              or circumstances outside our reasonable control. See our{' '}
              <a href="/risk-disclosure" className="text-teal hover:underline">
                Risk Disclosure
              </a>{' '}
              for more detail.
            </p>
          </section>

          <section>
            <h2 className="text-paper font-medium mb-2">8. Changes to these terms</h2>
            <p>We may update these terms from time to time. Continued use of Birrly means you accept the changes.</p>
          </section>

          <section>
            <h2 className="text-paper font-medium mb-2">9. Contact</h2>
            <p>
              Questions about these terms? Reach out via our{' '}
              <a href="/support" className="text-teal hover:underline">
                Support page
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
