# Going live: NO ID on Cloudflare

This guide moves **noidshow.com** from GoDaddy's website builder to this new site on Cloudflare (free).
Everything happens in a web browser. **You don't need to install anything.** Plan on about 45 minutes, plus some waiting while DNS switches over.

When you're done:
- The site is hosted free on Cloudflare Pages and updates itself when you publish episodes on RSS.com.
- Newsletter sign-ups are stored in your own Cloudflare database (D1), and you can download them any time.
- **Your Zoho email keeps working** (Step 6 makes sure of it).
- GoDaddy keeps only the domain name registration.

You'll need:
- [ ] A GitHub account (free): https://github.com/signup
- [ ] A Cloudflare account (free): https://dash.cloudflare.com/sign-up
- [ ] Your GoDaddy login

---

## Step 1: Get the code into your GitHub

The repo currently lives on comster's GitHub. Pick one option:

- **Option A, take ownership (recommended):** ask comster to go to the repo → **Settings → General → Danger Zone → Transfer ownership** and enter your GitHub username. Accept the email invite and the repo is yours.
- **Option B, make your own copy:** once comster has added you as a collaborator, open the repo and click **Use this template → Create a new repository**. Name it `noidshow-site`.

## Step 2: Create the newsletter database

1. Log in to Cloudflare. In the left menu, go to **Storage & Databases → D1 SQL Database → Create**.
2. Name it **`noid`** and click **Create**.
3. Open the database, go to the **Console** tab, paste this and click **Execute**:

```sql
CREATE TABLE IF NOT EXISTS subscribers (
  email      TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  country    TEXT,
  source     TEXT
);
```

## Step 3: Create the website on Cloudflare Pages

1. Go to **Workers & Pages → Create**. Choose the **Pages** tab, then **Import an existing Git repository** (also labelled "Connect to Git").
   *(Make sure you're on **Pages**, not Workers.)*
2. Connect your GitHub account, allow access to the `noidshow-site` repo, select it, and click **Begin setup**.
3. Fill in:
   | Setting | Value |
   |---|---|
   | Project name | `noidshow` |
   | Production branch | `main` |
   | Framework preset | **None** |
   | Build command | `node scripts/build.mjs` |
   | Build output directory | `dist` |
   | Environment variables → Add | `NODE_VERSION` = `20` |
4. Click **Save and Deploy**. After about a minute you'll get a link like `https://noidshow.pages.dev`. Open it. That's the new site.

## Step 4: Connect the database and set an admin password

In the Pages project, go to **Settings**:

1. **Bindings → Add → D1 database**
   - Variable name: **`DB`** (capital letters, exactly that)
   - D1 database: **`noid`**
   - Save.
2. **Variables and Secrets → Add**
   - Type: **Secret**
   - Name: **`ADMIN_TOKEN`**
   - Value: a long random password, at least 20 characters. Use a password manager and **save it**, because you'll use it to download your subscriber list.
   - Save.
3. Go to **Deployments**, open the latest one, and click **⋯ → Retry deployment** so the new settings take effect.

## Step 5: Check the new site (on the .pages.dev link)

- [ ] The homepage shows the latest episode, and **Play** works
- [ ] **Episodes** page: search works, and timestamps jump to the right spot
- [ ] Donate buttons go to the right PayPal, Patreon and Venmo
- [ ] Newsletter: enter your own email and you see *"You're on the list"*
- [ ] Open `https://noidshow.pages.dev/api/subscribers?token=YOUR_ADMIN_TOKEN` and a CSV file with your email downloads

If something's off, see **Troubleshooting** at the bottom.

## Step 6: Move the domain's DNS to Cloudflare (email-safe)

This is where you're most likely to break email, so go slowly and check each record.

**6a. Add the domain to Cloudflare**
1. Cloudflare home → **Add a domain** → `noidshow.com` → choose **Free** plan.
2. Cloudflare scans your current DNS records. **Compare them against this list**, which is what noidshow.com had at hand-off (Nov 2026):

| Type | Name | Content | Keep? |
|---|---|---|---|
| MX | `@` | `mx.zoho.com` (priority 10) | ✅ **Keep** (email) |
| MX | `@` | `mx2.zoho.com` (priority 20) | ✅ **Keep** (email) |
| MX | `@` | `mx3.zoho.com` (priority 50) | ✅ **Keep** (email) |
| TXT | `@` | `v=spf1 ip4:136.143.188.54 include:sendersrv.com include:zohomail.com ~all` | ✅ **Keep** (email) |
| TXT | `zmail._domainkey` | `v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDEvteL5S1InqE2Jt6ejIoU89aiTNfjEPlkJK8fRUZdi1lVzTvSUnroe/a/9Y0+Lub0S0fSjt5iGzmfmF4SLFHA5bjnNsCBmX17BwIY4dmAeOUfRgtg5ImH3CV/5vhs9zBjPtLUnGuMJzy900jz6wTvaozeyay65BbaUqfEKue21wIDAQAB` | ✅ **Keep** (email). The scan often misses this one, so add it by hand if it isn't there |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:postmaster@noidshow.com; ruf=mailto:postmaster@noidshow.com; aspf=r; adkim=r` | ✅ **Keep** (email) |
| A | `@` | `13.248.243.5` | ❌ **Delete** (old GoDaddy site) |
| A | `@` | `76.223.105.230` | ❌ **Delete** (old GoDaddy site) |
| A or CNAME | `www` | `13.248.243.5` / `76.223.105.230` / `noidshow.com` | ❌ **Delete** (old GoDaddy site) |

   > The MX and TXT rows must be set to **DNS only** (grey cloud). Cloudflare does this automatically for MX and TXT.
   > Any other Zoho records in GoDaddy (for example `zb…` verification TXT records): keep them too. When in doubt, keep it.

3. Continue. Cloudflare shows you **two nameservers**, something like `xxx.ns.cloudflare.com` and `yyy.ns.cloudflare.com`. Copy them.

**6b. Point GoDaddy at Cloudflare**
1. GoDaddy → **My Products → noidshow.com → DNS → Nameservers → Change Nameservers**.
2. If GoDaddy shows **DNSSEC** as on, turn it off first.
3. Choose **"I'll use my own nameservers"** and enter the two Cloudflare nameservers. Save.
4. Wait. Cloudflare emails you when the domain is **Active**, usually within an hour and occasionally up to a day. The old site keeps working while you wait.

**6c. Attach the domain to the new site**
1. Cloudflare → **Workers & Pages → noidshow → Custom domains → Set up a custom domain** → `noidshow.com` → Activate.
2. Do it again for `www.noidshow.com`.
3. HTTPS turns on automatically within a few minutes.

## Step 7: Final checks

- [ ] `https://noidshow.com` and `https://www.noidshow.com` both show the new site
- [ ] **Send a test email to your @noidshow.com Zoho address** from Gmail and confirm it arrives. Reply to confirm sending works too.
- [ ] Sign up for the newsletter on the live site and confirm you appear in the CSV download

## Step 8: Bring over your existing newsletter list

1. In GoDaddy's email marketing / contacts area, **export your subscribers** as a CSV.
2. Turn it into a database import. Any computer with [Node.js](https://nodejs.org) installed can do this, or ask comster:
   ```bash
   node scripts/import-subscribers.mjs path/to/godaddy-export.csv
   ```
   This creates `db/import-subscribers.sql`.
3. Cloudflare → D1 → `noid` → **Console**: paste each `INSERT …;` statement from that file and click **Execute**. Running it twice is harmless because duplicates are skipped.
4. Delete the export and the `.sql` file afterwards, since they contain people's email addresses.

## Step 9: Wrap up GoDaddy

- **Cancel the GoDaddy Website Builder / Websites + Marketing plan**, but only after Step 7 passes.
- **Keep the domain registration.** Either leave it at GoDaddy or transfer it later to Cloudflare Registrar, which charges at cost with no markup. Transfers are usually possible once the domain is more than 60 days old.
- Once you send the newsletter from a tool other than GoDaddy, that tool will tell you what SPF entry to add. At that point you can remove `include:sendersrv.com` (GoDaddy's sender) from the SPF TXT record.

---

## Day-to-day

| I want to… | Do this |
|---|---|
| Publish an episode | Just publish on RSS.com as usual. It appears on the site within about 10 minutes. |
| Change a link, donation tier or founding donor | On GitHub, open `site.config.js` → ✏️ edit → **Commit changes**. The site redeploys in about a minute. |
| Change homepage wording | Same, in `src/index.html` |
| Download newsletter subscribers | Visit `https://noidshow.com/api/subscribers?token=YOUR_ADMIN_TOKEN` |
| Add the Spotify link | Put the Spotify show URL in `site.config.js` (the `spotify` line) |

Episode timestamps and **Executive Producers** credits come from the RSS.com show notes. Keep writing them in the same format, such as `Executive Producers:` followed by names and `(12:30) Topic`, and the site picks them up.

**Optional:** to make search engines see each new episode right away, follow the 2-minute setup at the top of `.github/workflows/weekly-rebuild.yml`. It rebuilds the site every Thursday.

## Troubleshooting

| Problem | Fix |
|---|---|
| Build fails on Cloudflare | Check Settings → Variables has `NODE_VERSION` = `20`, and the build command and output directory match Step 3. |
| Newsletter says *"Sign-ups aren't connected yet"* | The D1 binding is missing or not named exactly `DB` (Step 4). Retry the deployment after fixing it. |
| Newsletter says *"Sign-up failed"* | The table wasn't created. Run the SQL from Step 2 in the D1 Console. |
| `/api/subscribers` says *Not found* | The `ADMIN_TOKEN` secret isn't set, or is shorter than 16 characters. Retry the deployment after setting it. |
| Custom domain stuck on "Verifying" | An old `A`/`CNAME` record for `@` or `www` is still in Cloudflare DNS. Delete it (Step 6a). |
| Email stopped arriving | Compare Cloudflare DNS to the table in Step 6a. The MX records and the Zoho TXT records must be there. |
