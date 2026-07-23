# Deploying and previewing this project

## Fastest option: preview it locally with Docker Compose

If you have Docker installed, this runs the whole stack (Postgres, backend, frontend)
with one command:

```bash
cd p2p-exchange
docker compose up --build
```

Then open:
- **App**: http://localhost:3000
- **API**: http://localhost:4000

First run takes a few minutes (installing dependencies, building both apps). The
backend automatically runs `prisma db push` on startup to create the database tables,
so there's nothing else to set up.

To stop it: `Ctrl+C`, then `docker compose down` (add `-v` to also wipe the database).

**Note on the JWT secrets in `docker-compose.yml`**: they're placeholder values for
local preview only. Change them before deploying anywhere real (see below).

## Deploying for real (not just local preview)

The frontend and backend deploy separately — that's normal for this kind of app.

### 1. Backend + Postgres — Railway or Render

Both offer a free/cheap tier, managed Postgres, and can build straight from the
`backend/Dockerfile` in this repo.

**Railway** (railway.app):
1. Push this project to a GitHub repo
2. New Project → Deploy from GitHub repo → select it, set the root directory to `backend`
3. Add a Postgres plugin from Railway's marketplace — it gives you a `DATABASE_URL` automatically
4. Add these environment variables in the service settings:
   - `JWT_SECRET`, `JWT_REFRESH_SECRET` — generate real random values, e.g. `openssl rand -hex 32`
   - `JWT_EXPIRES_IN=15m`, `JWT_REFRESH_EXPIRES_IN=7d`
   - `PLATFORM_DEPOSIT_ADDRESS=TEgqauvdKFjcXDGfywsH1oWyQKegQbN4pA`
   - `PORT=4000` (Railway usually sets this for you — check the generated domain)
5. Set the start command to `npx prisma db push && node dist/main.js` (or switch to
   proper migrations first — see note below)
6. Deploy. Railway gives you a public URL like `https://your-app.up.railway.app`

**Render** works the same way (render.com): New → Web Service → connect the repo,
root directory `backend`, it detects the Dockerfile automatically. Add a Postgres
instance from Render's dashboard and the same environment variables.

### 2. Frontend — Vercel

Vercel is built for Next.js specifically and is the least friction option:

1. vercel.com → New Project → import the same GitHub repo
2. Set the root directory to `frontend`
3. Add one environment variable: `NEXT_PUBLIC_API_URL` = your backend's URL from step 1
   (e.g. `https://your-app.up.railway.app`)
4. Deploy — Vercel gives you a URL like `https://your-app.vercel.app`

### 3. Connect them

Once both are deployed, go back to the backend's environment variables and make sure
CORS isn't wide open in production — right now `main.ts` calls `app.enableCors()` with
no restriction, which is fine for development but should be limited to your frontend's
actual domain before this handles real users:

```ts
app.enableCors({ origin: 'https://your-app.vercel.app' });
```

### Things to fix before this handles real money and real users

These aren't blockers for a preview or demo, but they matter before launch:

- **KYC uploads are stored on local disk** (`backend/uploads/`). Most hosting platforms
  wipe the filesystem on every redeploy — move this to S3 (or Backblaze B2, Cloudflare
  R2) before real users submit documents you can't afford to lose.
- **Use real migrations, not `db push`.** `db push` is fine for getting started, but for
  a real deployment run `npx prisma migrate dev` locally against a dev database to
  generate migration files, commit them, and use `npx prisma migrate deploy` in
  production instead — this gives you a reviewable history of schema changes.
- **Generate real secrets.** Don't reuse the `dev-only-change-me` values from
  `docker-compose.yml` anywhere real.
- **Secure the custodial wallet's private key** — see the note on this already in the
  main `README.md`.
- **Restrict CORS** to your actual frontend domain, as noted above.
