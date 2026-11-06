// GET /api/subscribers?token=YOUR_ADMIN_TOKEN
// Downloads the newsletter list from D1 as a CSV file (opens fine in Excel / Google Sheets,
// and imports into any email-sending tool).
//
// Setup: in Cloudflare Pages → Settings → Variables and Secrets, add a *secret* named
// ADMIN_TOKEN with a long random value. Without it, this endpoint stays disabled.

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const given = url.searchParams.get('token') || (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');

  if (!env.ADMIN_TOKEN || env.ADMIN_TOKEN.length < 16) return text(404, 'Not found');
  if (!(await sameSecret(given, env.ADMIN_TOKEN))) return text(401, 'Wrong or missing token');
  if (!env.DB) return text(500, 'No D1 database bound as "DB"');

  const { results } = await env.DB.prepare('SELECT email, created_at, country, source FROM subscribers ORDER BY created_at').all();
  const cell = (v) => (v == null ? '' : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
  const csv = ['email,signed_up,country,page', ...results.map((r) => [r.email, r.created_at, r.country, r.source].map(cell).join(','))].join('\n');
  const day = new Date().toISOString().slice(0, 10);

  return new Response(csv + '\n', {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="noid-subscribers-${day}.csv"`,
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex',
    },
  });
}

// Constant-time comparison so the token can't be guessed by timing.
async function sameSecret(a = '', b = '') {
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([crypto.subtle.digest('SHA-256', enc.encode(a)), crypto.subtle.digest('SHA-256', enc.encode(b))]);
  const x = new Uint8Array(ha), y = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

const text = (status, body) => new Response(body, { status, headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } });
