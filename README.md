# NO ID website (noidshow.com)

A fast static site for the NO ID podcast, built for **Cloudflare Pages** (free tier).

- Plain HTML, CSS and JS. No framework and no npm dependencies, just Node 18+ to build.
- Episodes come from the RSS.com feed (`https://media.rss.com/noid/feed.xml`):
  - **At build time** they're baked into the HTML, which keeps it fast and good for search engines.
  - **Live**, a small function at `/api/episodes` re-reads the feed (cached for 10 minutes), so a new episode appears on the site within minutes without a redeploy.
- Persistent audio player with ±15/30s skip, speed control, resume position, lock-screen controls and clickable timestamps.
- Donations (PayPal, Patreon, Venmo, Bitcoin), newsletter sign-up, socials and "listen on" links.

## Editing content

| What | Where |
|---|---|
| Links: platforms, socials, donate, email, donation tiers, founding donors | `site.config.js` |
| Homepage copy and sections | `src/index.html` |
| Styles | `src/assets/css/site.css` |
| Episode card and row markup | `src/assets/js/render.js` |
| Images | `src/assets/img/` |

Episodes, timestamps and "Executive Producers" credits are read from each episode's show notes on RSS.com. Keep using the same `Executive Producers:` and `(mm:ss) topic` format and the site picks them up automatically.

**To-do:** add the Spotify URL in `site.config.js`. The button stays hidden while the URL is empty.

## Run locally

```bash
node scripts/build.mjs      # builds into dist/
node scripts/serve.mjs      # static preview at http://localhost:8788 (no /api functions)
npm run dev                 # full Cloudflare emulation, including /api functions (downloads wrangler)
```

## Deploying and going live

**See [SETUP.md](SETUP.md)** for the browser-only, step-by-step guide: Cloudflare Pages, the D1 newsletter database, moving DNS from GoDaddy without breaking Zoho email, and importing the old subscriber list.

## How the pieces fit

| Path | What it does |
|---|---|
| `scripts/build.mjs` | Fetches the RSS feed and renders `src/` into `dist/` (the Cloudflare build command) |
| `functions/api/episodes.js` | `GET /api/episodes`: live episode list, cached for 10 minutes at Cloudflare's edge |
| `functions/api/subscribe.js` | `POST /api/subscribe`: saves sign-ups to D1 (binding `DB`), or to Kit/MailerLite/Buttondown if `NEWSLETTER_PROVIDER` is set |
| `functions/api/subscribers.js` | `GET /api/subscribers?token=…`: downloads the list as CSV (needs the `ADMIN_TOKEN` secret) |
| `db/schema.sql` | D1 table definition |
| `scripts/import-subscribers.mjs` | Turns an exported CSV into SQL for D1 |
| `.github/workflows/weekly-rebuild.yml` | Optional Thursday rebuild via a Cloudflare deploy hook |
| `data/feed-cache.json` | Last good copy of the feed, used if RSS.com is down during a build |

D1 **stores** the list but doesn't **send** email. The weekly newsletter goes out from whatever email tool you use; download the CSV and import it there.

### Command-line equivalents (optional)

```bash
npx wrangler d1 create noid
npx wrangler d1 execute noid --remote --file=db/schema.sql
npx wrangler d1 execute noid --remote --command "SELECT email, created_at FROM subscribers ORDER BY created_at"
```
