# P2P USDT ↔ ETB Exchange — starter scaffold

This scaffold covers the full roadmap for the web app: **Authentication** (with
Google-Authenticator-style 2FA), **KYC**, **Wallet**, **P2P Marketplace**, **Trade
Room**, **Escrow**, **Notifications**, and an **Admin Dashboard** (KYC review, wallet
confirmation, dispute resolution, revenue). Deposits/withdrawals go through one
custodial TRC20 address rather than an automated chain watcher — see the note further
down. Every completed trade takes a 2% platform commission, configurable via
`PLATFORM_FEE_PERCENT`.

**Not included in this scaffold**: the React Native **Mobile App** (a separate
codebase, best started once the web API is stable) and hardened **Production
Deployment** (see `DEPLOYMENT.md` for how to actually deploy what's here — the
remaining production-readiness items, like moving KYC uploads off local disk and
switching to real Prisma migrations, are called out there).

## What's included

- `backend/` — NestJS API
  - `prisma/schema.prisma` — the full data model (users, wallets, ads, trades, escrow, disputes, etc.)
  - `src/auth/` — signup, login, JWT issuance/validation, and full TOTP 2FA: setup
    (QR code), enable, disable, and a two-step login flow when 2FA is on (**working**)
  - `src/kyc/` — submit ID document + selfie (stored to local disk for now), admin
    approve/reject queue, gates Ads/Trades on an approved KYC record (**working**)
  - `src/wallet/` — balance reads, lock/release/refund ledger functions, plus deposit
    and withdrawal requests against a single custodial TRC20 address (**working**)
  - `src/users/` — creates a user with USDT + ETB wallets in one transaction
  - `src/ads/` — post, browse, and pause marketplace offers, requires approved KYC (**working**)
  - `src/trades/` — start a trade (locks seller's USDT in escrow), mark paid, confirm
    (releases escrow), cancel (refunds escrow), dispute + admin dispute resolution,
    plus trade room chat over REST and a Socket.io gateway for realtime delivery (**working**)
  - `src/notifications/` — persisted notifications with a realtime push over Socket.io
    on key trade events (escrow locked, marked paid, completed, disputes resolved) (**working**)
  - `src/common/roles.guard.ts` + `roles.decorator.ts` — `@Roles(Role.ADMIN)` guard
    used to protect all the admin endpoints
- `frontend/` — Next.js app
  - `app/page.tsx` — landing page with a live-style USDT → ETB converter as the hero
  - `app/signup` — signup form
  - `app/login` — login form with the 2FA code step when required
  - `app/settings/2fa` — scan-the-QR-code 2FA setup flow
  - `app/kyc` — ID document + selfie upload, shows current review status
  - `app/wallet` — balances, the shared TRC20 deposit address with QR + txid submission,
    withdrawal request form, recent activity
  - `app/notifications` — in-app notification list
  - `app/marketplace`, `app/marketplace/[id]` — browse offers, post a new offer, start a trade
  - `app/trades/[id]` — the trade room: status, mark paid/confirm/cancel/dispute
    actions, chat (polls every 4s for now — swap in `socket.io-client` against the
    `TradeChatGateway`/`NotificationsGateway` for instant delivery)
  - `app/admin/kyc` — admin queue to approve/reject submissions, view uploaded docs
  - `app/admin/wallet` — confirm/reject pending deposits and withdrawals
  - `app/admin/disputes` — review open disputes and resolve them (release to buyer or
    refund to seller)
  - `app/admin/revenue` — accumulated 2% commission balance

## About the 2% platform commission

Every time a trade completes — either a normal buyer/seller confirmation, or a
dispute resolved in the buyer's favor — the platform takes a cut of the USDT
before it reaches the buyer:

- The seller's escrowed amount is unlocked in full, as before.
- The buyer receives **98%** of it.
- The remaining **2%** goes to the platform's own internal wallet (a hidden
  system account, `platform@birrly.internal`, that exists purely to hold this
  balance — nobody can log into it).

The rate is set by `PLATFORM_FEE_PERCENT` in `.env` (default `2`, meaning 2%) —
change it there if you want a different rate. It's applied on the USDT side
of the trade, not the ETB side, so the ETB amount the buyer pays the seller
is unaffected; only the USDT the buyer receives is reduced. This is shown to
users before and during a trade (`/marketplace/[id]` and `/trades/[id]`).

An admin can see the accumulated commission at `/admin/revenue`. Right now it's
just an internal ledger balance — actually moving that USDT out to a real
business wallet works the same way as any other withdrawal (send manually from
the custodial address, since it's all backed by the same real funds).

**Cancelled or refunded trades are never charged a fee** — no commission is
taken unless a trade actually completes.

## About the custodial wallet address

All deposits and withdrawals go through one TRC20 address
(`PLATFORM_DEPOSIT_ADDRESS` in `.env`) instead of per-user addresses or an
automated chain watcher. This is simpler to run, but it means **the admin
confirmation step is a real security control, not a formality**:

- When confirming a deposit at `/admin/wallet`, actually look up the
  transaction hash on [TronScan](https://tronscan.org) and check that the
  amount, the receiving address (must be `PLATFORM_DEPOSIT_ADDRESS`), and the
  sender all make sense together — a submitted hash on its own proves nothing.
- The same hash can only be submitted once (enforced in `wallet.service.ts`),
  but nothing stops someone from submitting a hash for a transaction that
  isn't theirs, or under-reporting the amount they actually sent — the
  on-chain check is what catches that.
- Withdrawals lock the user's balance the moment they're requested, so the
  ledger stays correct even if the admin takes a while to actually send the
  USDT out.
- Keep the private key for this address somewhere far more secure than a
  laptop or shared doc — anyone with it can move every user's funds. As
  volumes grow, moving most of the balance to cold storage and keeping only a
  small operating balance here is worth doing early rather than late.

## Making a user an admin

There's no signup flow for admins on purpose — promote someone directly in the database:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'you@example.com';
```

They'll then see the review queue at `/admin/kyc` (no separate admin login — it's the
same account, just with the ADMIN role).

## Running it locally

You'll need Node.js 20+, and PostgreSQL running locally (or a connection string to one).

### Backend

```bash
cd backend
npm install
cp .env.example .env
# edit .env with your real DATABASE_URL and JWT secrets
npm run prisma:migrate   # creates the tables from schema.prisma
npm run start:dev        # runs on http://localhost:4000
```

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev               # runs on http://localhost:3000
```

Visit `http://localhost:3000` — the landing page, signup, and login all work end to end
against the backend once both are running.

## What's next

The core web app (everything in the roadmap except Mobile App and full production
hardening) is built. See **`DEPLOYMENT.md`** for how to preview it locally with one
command, or actually deploy it.

Two items are intentionally not part of this scaffold:

- **Mobile App** — a React Native project that reuses this same backend API. Best
  started once the web app has been used for real for a bit, since the API/data model
  may still shift a little at that point.
- **Full production hardening** — beyond what's in `DEPLOYMENT.md`: monitoring
  (Sentry/Grafana), load testing, a real security review before handling meaningful
  volume, rate limiting on auth/withdrawal endpoints, and moving most of the custodial
  wallet's balance to cold storage.

Ask me to build either of these next, or to expand any existing module further
(e.g. a fuller admin user-management view, email/SMS notifications via BullMQ).

## Trying the full flow end to end

1. Sign up two accounts (buyer and seller) via `/signup`
2. For each account, go to `/kyc` and submit an ID + selfie, then promote yourself to
   admin (see above) and approve both at `/admin/kyc`
3. Optionally set up 2FA at `/settings/2fa` — next login will ask for a 6-digit code
4. As the seller, go to `/wallet`, note the deposit address, and (for testing) either
   send real USDT to it or just insert a balance directly in Postgres
   (`UPDATE wallets SET balance = 1000 WHERE ...`) — real deposits go through
   `/wallet` → submit txid → admin confirms at `/admin/wallet`
5. Go to `/marketplace` and post a **SELL** offer
6. As the buyer, open the offer from `/marketplace` and start a trade — this locks
   the seller's USDT in escrow immediately
7. In the trade room (`/trades/[id]`), mark it paid as the buyer, then confirm as the
   seller — the escrowed USDT moves to the buyer's wallet
8. The buyer can then withdraw from `/wallet` — the request appears at
   `/admin/wallet` for the admin to send out and confirm
