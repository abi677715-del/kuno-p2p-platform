# Affiliate Magnet

Finds, scores and helps recruit affiliate (partner) candidates for the **Melbet** affiliate programme. A person
makes every decision; the software does the legwork.

```
 DISCOVERY                      AI                         PEOPLE
 YouTube search ─┐
 Pasted links ───┼─► leads ─► Claude scores 0-100 ─► priority ─► manager review ─► outreach
 CSV import ─────┘            (+ red flags)           leads      approve / reject    (manager approves
 (TikTok, Instagram, X, ...)                                                          the exact email)
```

## What it does

| Step | How |
|---|---|
| **Find** | YouTube keyword search (official API), pasted links (YouTube, Telegram, websites), and CSV/JSON import for platforms that can't be read automatically (TikTok, Instagram, X, Reddit). The same creator found twice is one lead. |
| **Score** | Claude reads the public profile and rates audience fit, content fit, credibility and promo experience. **Reach is calculated from the real follower count, not guessed.** The final 0-100 score is a weighted sum computed in code (weights are configurable), so it is transparent and repeatable. |
| **Protect the brand** | Hard disqualifiers: audience that may include under-18s, "fixed match"/sure-tip scams, illegal or hateful content, and leads outside your target countries. They cap the score low and **cannot be approved** from the dashboard. Softer flags (guaranteed-win claims, fake engagement, spam, adult content) cap the score at 45 and keep the lead out of "priority". |
| **Review** | The dashboard lists priority leads with the score breakdown, strengths, concerns and flags. A manager approves, rejects, or marks do-not-contact. Every decision is recorded (who, when). |
| **Outreach** | Only for approved leads with a published email. Claude drafts a short, honest message; the manager edits it and **approves that exact text**; only then can it be sent. One email per lead, a daily cap, and every message carries the sender's postal address, a working unsubscribe link, and an 18+/responsible-gambling notice. Wording that promises income, "risk-free" or "guaranteed" results is blocked. |

**Nothing is emailed until you turn it on.** `OUTREACH_DRY_RUN` defaults to `true`: "Send" only shows a preview.

## Run it locally

Needs Node 20+ and PostgreSQL.

```bash
cd affiliate-magnet
npm install
cp .env.example .env        # fill in DATABASE_URL, ADMIN_API_KEY, ANTHROPIC_API_KEY
npx prisma migrate deploy
npm run build && npm start   # http://localhost:4100/dashboard/
```

Open `/dashboard/`, sign in with your `ADMIN_API_KEY`, and add some leads.

## Deploy (Railway)

1. New project → add a **PostgreSQL** database, then a service from this repo with root directory `affiliate-magnet` (it builds from the `Dockerfile`; migrations run on start).
2. Set the variables from `.env.example`. At minimum: `DATABASE_URL` (Railway fills this in), `ADMIN_API_KEY`, `ANTHROPIC_API_KEY`, `PUBLIC_BASE_URL`.
3. Open `https://<your-app>/dashboard/`.

Keep this app's database separate from any other project's.

## Settings that shape the results

All in environment variables (see `.env.example`): `PRODUCT_DESCRIPTION` and `IDEAL_AFFILIATE_PROFILE` (what a good partner looks like),
`ALLOWED_COUNTRIES`, `PRIORITY_THRESHOLD`, and the `WEIGHT_*` values. Changing them never needs a code change.

## Costs

Scoring uses one Claude call per lead and drafting one per approved lead. Models default to the most capable
(`claude-opus-5-5`); set `CLASSIFIER_MODEL` / `DRAFT_MODEL` to a cheaper model if you score thousands of leads.
YouTube keyword search costs about 100 of the 10,000 free daily quota units per search.

## Compliance — please read

This tool helps with the mechanics; **you** are responsible for the programme being lawful and on-brand.

- **Check the rules for each market** where you recruit and where the partner's audience lives. Online betting and its promotion are illegal or restricted in many countries. Use `ALLOWED_COUNTRIES`.
- **Follow Melbet's affiliate terms and any marketing guidelines** you have been given. This tool does not know them: put the important ones into `IDEAL_AFFILIATE_PROFILE` and review every lead against them.
- **Only public information is used**, and only from sources that allow it: the official YouTube API, public Telegram previews, and websites whose `robots.txt` allows it. TikTok, Instagram and X are import-only on purpose (scraping them breaks their terms).
- **Cold email rules apply** (CAN-SPAM, GDPR/PECR, and local equivalents). In some countries cold-emailing a person without prior consent is not allowed at all. The tool enforces: a real sender address, one-click unsubscribe, a permanent suppression list, and one email per lead. It cannot decide whether emailing a particular person is lawful where they live.
- **Never promise earnings.** The drafts and the sending check avoid it; keep it that way when you edit.
- AI scores are a first filter, not a verdict. Read the evidence before approving.

## Security notes

- One shared team key (`ADMIN_API_KEY`) protects the dashboard and API; the API refuses everything if it isn't set. For a larger team, put it behind your company's login/VPN.
- Text from creators' profiles is untrusted: it is never inserted into the page as HTML, and is fenced off from the AI's instructions.
- Pasted URLs are fetched by the server, so private/internal addresses are refused (including after redirects). Only managers with the key can trigger a fetch.
- Set `UNSUBSCRIBE_SECRET` to its own long random value and never change it: unsubscribe links in emails already sent stop working if it changes.

## API (all need `Authorization: Bearer <ADMIN_API_KEY>`)

`POST /discovery/youtube` · `POST /discovery/urls` · `POST /discovery/import` · `POST /classification/run` ·
`GET /leads` (`status`, `platform`, `minScore`, `priority`, `needsAttention`, `q`, `limit`, `offset`) · `GET /leads/stats` · `GET /leads/:id` ·
`PATCH /leads/:id` · `POST /leads/:id/{approve,reject,replied,do-not-contact,rescore}` ·
`POST /leads/:id/outreach/draft` · `GET|PATCH /outreach/:id` · `POST /outreach/:id/{approve,send}` ·
public: `GET|POST /unsubscribe/:token`, `GET /health`.

## Tests

```bash
npm test                               # 80 unit tests, no database needed
DATABASE_URL=... npm run test:e2e      # 30 end-to-end tests against a real database (Claude and email are faked)
```

## Not built yet

- Reddit and X search (their APIs are paid or restricted — import for now).
- Automatic follow-ups and reply tracking (a manager marks "they replied").
- Per-person logins and roles.
