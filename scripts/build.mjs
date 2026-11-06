// Build: fetch the podcast feed, render the templates in /src into /dist.
// Usage: node scripts/build.mjs        (no dependencies; Node 18+)
import { readFile, writeFile, mkdir, cp, rm, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import site from '../site.config.js';
import { parseFeed, FEED_URL } from '../lib/feed.js';
import { esc, artUrl, playAttrs, episodeCard, latestEpisode, episodeRow } from '../src/assets/js/render.js';
import { icon } from './icons.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(root, 'src');
const OUT = join(root, 'dist');
const CACHE = join(root, 'data', 'feed-cache.json');

// ---------- feed ----------
async function loadFeed() {
  try {
    const res = await fetch(FEED_URL, { headers: { 'user-agent': 'noidshow.com site build' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = parseFeed(await res.text());
    if (!data.episodes.length) throw new Error('feed had no episodes');
    await writeFile(CACHE, JSON.stringify(data));
    console.log(`✓ feed: ${data.episodes.length} episodes, latest "${data.episodes[0].title}"`);
    return data;
  } catch (err) {
    if (existsSync(CACHE)) {
      console.warn(`! feed fetch failed (${err.message}), using data/feed-cache.json`);
      return JSON.parse(await readFile(CACHE, 'utf8'));
    }
    throw err;
  }
}

const { episodes } = await loadFeed();
const latest = episodes[0];
const ver = Date.now().toString(36); // cache-buster for css/js

// ---------- partials ----------
const ext = 'target="_blank" rel="noopener"';
const listen = site.listen.filter((l) => l.url);

function head({ title, description = site.description, path = '/', noindex }) {
  const url = site.url + (path === '/404' ? '/' : path);
  const ld = path === '/' ? `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'PodcastSeries',
    name: site.name,
    url: site.url,
    description: site.description,
    image: `${site.url}/assets/img/cover-800.jpg`,
    webFeed: site.feed,
    author: [{ '@type': 'Person', name: 'Paul Banducci' }, { '@type': 'Person', name: 'Scott Moskowitz' }],
    sameAs: [...listen.map((l) => l.url), ...site.socials.map((s) => s.url)],
  })}</script>` : '';
  return `<!doctype html>
<html lang="en" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${url}">`}
<meta name="theme-color" content="#0e0d0b">
<meta property="og:type" content="website">
<meta property="og:site_name" content="NO ID">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${site.url}/assets/img/og.jpg">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@thenoidshow">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
<link rel="alternate" type="application/rss+xml" title="NO ID podcast feed" href="${site.feed}">
<link rel="preload" href="/assets/fonts/ultra-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/archivo-latin-wdth-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preconnect" href="https://img.rss.com">
<link rel="stylesheet" href="/assets/css/site.css?v=${ver}">
<script>document.documentElement.classList.replace('no-js','js')</script>
<script type="module" src="/assets/js/site.js?v=${ver}"></script>
${ld}
</head>`;
}

function header(nav) {
  const cur = (n) => (nav === n ? ' aria-current="page"' : '');
  const p = nav === 'home' ? '' : '/';
  return `<a class="skip" href="#main">Skip to content</a>
<header class="site-header">
  <div class="wrap">
    <a class="brand" href="/" aria-label="NO ID home">
      <img src="/assets/img/wordmark-sm.webp" width="170" height="181" alt="NO ID">
      <span>The NO ID Show<br>Live from North Idaho</span>
    </a>
    <nav class="nav" id="nav" aria-label="Main">
      <a href="/episodes/"${cur('episodes')}>Episodes</a>
      <a href="${p}#listen">Listen</a>
      <a href="${p}#about">About</a>
      <a href="${p}#newsletter">Newsletter</a>
      <a href="${p}#contact">Contact</a>
    </nav>
    <div class="header-cta">
      <a class="btn btn--red" href="${p}#support">${icon('heart')}<span>Donate</span></a>
      <button class="menu-btn" type="button" aria-controls="nav" aria-expanded="false" aria-label="Menu">${icon('menu')}</button>
    </div>
  </div>
</header>`;
}

const socialsHtml = `<div class="socials">${site.socials
  .map((s) => `<a href="${esc(s.url)}" ${ext} aria-label="NO ID on ${esc(s.label)}">${icon(s.id)}</a>`)
  .join('')}</div>`;

function footer(nav) {
  const p = nav === 'home' ? '' : '/';
  return `<footer class="site-footer">
  <div class="wrap">
    <div class="footer-top">
      <p class="footer-mark" aria-label="NO ID">N<i></i><span>ID</span></p>
      <div class="footer-cols">
        <div><h4>Show</h4><ul>
          <li><a href="/episodes/">Episodes</a></li><li><a href="${p}#about">About</a></li><li><a href="${p}#support">Donate</a></li><li><a href="${p}#newsletter">Newsletter</a></li>
        </ul></div>
        <div><h4>Listen</h4><ul>${listen.map((l) => `<li><a href="${esc(l.url)}" ${ext}>${esc(l.label)}</a></li>`).join('')}</ul></div>
        <div><h4>Contact</h4><ul>
          <li><a href="mailto:${site.email}">Email us</a></li><li><a href="${site.voicemail}" ${ext}>Voicemail</a></li>
        </ul></div>
      </div>
    </div>
    <div class="footer-bottom">
      ${socialsHtml}
      <p>© ${new Date().getFullYear()} NO ID · Independent &amp; listener-supported · No ads, ever.</p>
    </div>
  </div>
</footer>`;
}

const player = `<div class="player" data-player aria-label="Audio player" role="region" hidden>
  <img class="player__art" src="data:," alt="" width="52" height="52" data-p-art>
  <div class="player__ctrls">
    <button class="pbtn" type="button" data-p-skip="-15" aria-label="Back 15 seconds">${icon('back')}<small>15</small></button>
    <button class="pbtn pbtn--main" type="button" data-p-toggle aria-label="Play or pause">${icon('play')}${icon('pause')}</button>
    <button class="pbtn" type="button" data-p-skip="30" aria-label="Forward 30 seconds">${icon('fwd')}<small>30</small></button>
  </div>
  <div class="player__info">
    <div class="player__title"><small data-p-num></small><span data-p-title></span></div>
    <div class="player__bar"><span data-p-cur>0:00</span><input type="range" min="0" max="100" step="1" value="0" aria-label="Seek" data-p-seek><span data-p-dur>0:00</span></div>
  </div>
  <div class="player__end">
    <button class="speed" type="button" data-p-speed aria-label="Playback speed">1×</button>
    <button class="pbtn" type="button" data-p-close aria-label="Close player">${icon('close')}</button>
  </div>
  <audio preload="none" data-p-audio></audio>
</div>`;

const listenChips = listen
  .filter((l) => l.id !== 'rsscom')
  .map((l) => `<a class="chip" href="${esc(l.url)}" ${ext}>${icon(l.id)}${esc(l.label)}</a>`)
  .join('');

const platforms =
  listen
    .map((l) =>
      l.id === 'rss'
        ? `<button class="platform" type="button" data-copy="${esc(l.url)}" data-copy-msg="RSS feed copied. Paste it into any podcast app.">${icon('rss')}<span>Copy RSS feed<small>Any podcast app</small></span></button>`
        : `<a class="platform" href="${esc(l.url)}" ${ext}>${icon(l.id)}<span>${esc(l.label)}<small>${l.id === 'youtube' ? 'Watch' : 'Listen'}</small></span></a>`
    )
    .join('');

const stack = `<div class="stack" aria-hidden="false">
  ${episodes.slice(1, 3).reverse().map((e) => `<div class="stack__card"><img src="${esc(artUrl(e.image, 600))}" width="600" height="600" alt="" decoding="async"></div>`).join('')}
  <div class="stack__card"><img src="${esc(artUrl(latest.image, 600))}" srcset="${esc(artUrl(latest.image, 600))} 600w, ${esc(artUrl(latest.image, 900))} 900w" sizes="(max-width: 860px) 360px, 520px" width="600" height="600" alt="Cover art for the latest NO ID episode: ${esc(latest.name)}" fetchpriority="high"></div>
  <a class="stack__badge" href="#latest"><span class="dot">${icon('play')}</span><span><small>New · Ep. ${latest.number ?? ''}</small><b>${esc(latest.name)}</b></span></a>
</div>`;

const give = [
  ['paypal', 'PayPal', 'One-time gift', site.donate.paypal],
  ['patreon', 'Patreon', 'Monthly support', site.donate.patreon],
  ['venmo', 'Venmo', '@noidshow', site.donate.venmo],
]
  .filter((g) => g[3])
  .map(([id, label, sub, url]) => `<a class="give__btn" href="${esc(url)}" ${ext}>${icon(id)}<span><b>${label}</b><small>${sub}</small></span>${icon('arrowUp', 'arrow')}</a>`)
  .join('') +
  (site.donate.bitcoin
    ? `<div class="btc">
    <img src="/assets/img/bitcoin-qr.png" width="522" height="615" alt="Bitcoin QR code for NO ID donations" loading="lazy">
    <div><b>${icon('bitcoin')}Bitcoin</b><p>Scan the code or copy the address.</p>
    <div class="addr"><code>${esc(site.donate.bitcoin)}</code><button class="copy" type="button" data-copy="${esc(site.donate.bitcoin)}" data-copy-msg="Bitcoin address copied">Copy</button></div></div>
  </div>`
    : '');

const tiers = site.tiers
  .map((t) => `<div class="tier"><div class="amt"><sup>$</sup>${esc(t.amount)}</div><h4>${esc(t.name)}</h4><p>${esc(t.note)}</p></div>`)
  .join('');

const founders = site.foundingDonors.map((n) => `<li>${esc(n)}</li>`).join('');

// Executive producers credited in the last few episodes
const recentProducers = [...new Set(episodes.slice(0, 4).flatMap((e) => e.producers).filter((n) => !/^anonymous$/i.test(n)))];
const recentProducersHtml = recentProducers.length
  ? `<h4>Recent executive producers</h4><ul class="names names--recent">${recentProducers.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>`
  : '';

// ---------- render ----------
function render(tpl, file) {
  const metaMatch = tpl.match(/^<!--page([^>]*)-->\s*/);
  const meta = {};
  if (metaMatch) for (const [, k, v] of metaMatch[1].matchAll(/(\w+)="([^"]*)"/g)) meta[k] = v;
  tpl = tpl.replace(/^<!--page[^>]*-->\s*/, '');
  const tokens = {
    HEAD: () => head({ title: meta.title || site.name, description: meta.description, path: meta.path, noindex: meta.noindex }),
    HEADER: () => header(meta.nav),
    FOOTER: () => footer(meta.nav),
    PLAYER: () => player,
    STACK: () => stack,
    LATEST: () => latestEpisode(latest),
    LATEST_PLAY_ATTRS: () => playAttrs(latest),
    RECENT: () => episodes.slice(1, 7).map((e, i) => episodeCard(e, { eager: i < 3 })).join('\n'),
    EPISODES_LIST: () => episodes.map(episodeRow).join('\n'),
    EP_COUNT: () => String(episodes.length),
    LISTEN_CHIPS: () => listenChips,
    PLATFORMS: () => platforms,
    GIVE: () => give,
    TIERS: () => tiers,
    FOUNDERS: () => founders,
    RECENT_PRODUCERS: () => recentProducersHtml,
  };
  return tpl.replace(/\{\{([A-Za-z_]+)(?::([^}]+))?\}\}/g, (m, key, arg) => {
    if (key === 'icon') return icon(arg);
    if (key === 'cfg') return esc(arg.split('.').reduce((o, k) => o?.[k], site) ?? '');
    if (tokens[key]) return tokens[key]();
    throw new Error(`Unknown token ${m} in ${file}`);
  });
}

async function walk(dir) {
  const out = [];
  for (const ent of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
for (const file of await walk(SRC)) {
  const rel = relative(SRC, file);
  const dest = join(OUT, rel);
  await mkdir(dirname(dest), { recursive: true });
  if (file.endsWith('.html')) {
    await writeFile(dest, render(await readFile(file, 'utf8'), rel));
  } else {
    await cp(file, dest);
  }
}
console.log(`✓ built ${OUT}`);
