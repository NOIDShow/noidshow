// GET /api/episodes?limit=7
// Fetches the RSS.com feed, parses it to JSON and caches it at Cloudflare's edge,
// so new episodes show up on the site without a redeploy.
import { parseFeed, FEED_URL } from '../../lib/feed.js';

const TTL = 600; // seconds a parsed copy is cached at the edge

export async function onRequestGet({ request, waitUntil }) {
  const url = new URL(request.url);
  const limit = Math.max(0, parseInt(url.searchParams.get('limit') || '0', 10) || 0);

  const cache = caches.default;
  const cacheKey = new Request(`${url.origin}/api/episodes/__all`);
  let full = await cache.match(cacheKey);

  if (!full) {
    const res = await fetch(FEED_URL, { cf: { cacheTtl: TTL, cacheEverything: true }, headers: { 'user-agent': 'noidshow.com' } });
    if (!res.ok) return json({ ok: false, error: `feed responded ${res.status}` }, 502, 30);
    const data = parseFeed(await res.text());
    full = json(data, 200, TTL);
    waitUntil(cache.put(cacheKey, full.clone()));
  }

  const data = await full.json();
  const episodes = limit ? data.episodes.slice(0, limit) : data.episodes;
  return json({ count: data.episodes.length, fetchedAt: data.fetchedAt, episodes }, 200, TTL);
}

function json(body, status = 200, maxAge = 60) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': `public, max-age=${Math.min(maxAge, 300)}, s-maxage=${maxAge}`,
    },
  });
}
