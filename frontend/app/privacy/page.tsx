export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-ink px-6 py-10 md:px-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-display font-bold text-2xl text-paper mb-2">Privacy Policy</h1>
        <p className="text-xs text-muted mb-8">Last updated: {new Date().getFullYear()}</p>

        <div className="space-y-6 text-sm text-muted leading-relaxed">
          <section>
            <h2 className="text-paper font-medium mb-2">1. Information we collect</h2>
            <p>
              We collect the information you provide when you sign up (full name, email, phone number), identity
              documents you submit for KYC verification, and records of your trades, ads, and support tickets.
            </p>
          </section>

          <section>
            <h2 className="text-paper font-medium mb-2">2. How we use it</h2>
            <p>
              We use your information to operate your account, verify your identity, facilitate trades, send
              account-related emails (like confirming your email address), respond to support requests, and
              investigate disputes or suspected fraud.
            </p>
          </section>

          <section>
            <h2 className="text-paper font-medium mb-2">3. Who can see your information</h2>
            <p>
              Your trading counterparties see your email address during an active trade. Our support and admin team
              can view your account details, trade history, and KYC documents when needed to resolve disputes or
              respond to support requests. We do not sell your data to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-paper font-medium mb-2">4. Data storage</h2>
            <p>
              Your data is stored in our database and, where relevant, with our email delivery provider (for
              sending account emails). We take reasonable steps to keep this data secure, including password
              hashing and optional two-factor authentication on your account.
            </p>
          </section>

          <section>
            <h2 className="text-paper font-medium mb-2">5. Your choices</h2>
            <p>
              You can update your name, phone number, profile photo, and password at any time from your Profile
              page. To request deletion of your account or data, contact us via the Support page.
            </p>
          </section>

          <section>
            <h2 className="text-paper font-medium mb-2">6. Changes to this policy</h2>
            <p>We may update this policy from time to time. Continued use of Birrly means you accept the changes.</p>
          </section>

          <section>
            <h2 className="text-paper font-medium mb-2">7. Contact</h2>
            <p>
              Questions about your data? Reach out via our{' '}
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
