# Mollie Bachner Dressage

Website for **Mollie Bachner Dressage** — dressage training, lessons, clinics and sales support in Vermont and across New England — with an inquiry form and a small password-protected inbox where Mollie reviews, updates and exports inquiries.

**Live:** https://mollie-bachner-dressage-llc.vercel.app

## Tech stack

- Vite 8 + React 19 (JavaScript), plain CSS; all copy in `src/content.js`
- `server.js` — a dependency-free Node server that serves `dist/` and the API:
  - `POST /api/inquiries` — public inquiry form
  - `GET/PATCH /api/admin/inquiries…`, `GET /api/admin/inquiries.csv` — admin inbox (requires `ADMIN_PASSWORD`)
- Inquiries are stored in `DATA_DIR/inquiries.json`

## Local setup

Requires Node 20+.

```bash
npm install
cp .env.example .env     # then set ADMIN_PASSWORD
npm run dev              # front end only (Vite)
npm run build && npm start   # full app with the API on http://localhost:8787
```

## Environment variables

Names only — never commit values.

| Variable | Purpose |
|---|---|
| `ADMIN_PASSWORD` | Password for the admin inbox. Required in production; the API refuses admin requests without it. |
| `PORT` | Port for `server.js` (default 8787) |
| `DATA_DIR` | Where `inquiries.json` is written (needs a persistent disk) |

## Deploying

> The Vercel deployment serves the static Vite build only — `server.js` does not run there, so the inquiry form and admin inbox need a host that runs `npm start` with a persistent `DATA_DIR` (e.g. a small VPS, Render or Railway), or the API needs porting to serverless functions with a database.
