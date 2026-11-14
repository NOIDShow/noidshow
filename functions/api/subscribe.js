import { syncSender } from '../../lib/sender.js';

// POST /api/subscribe  — newsletter sign-up.
//
// Default: store emails in Cloudflare D1. Bind a D1 database to the Pages project
// as "DB" (schema: db/schema.sql). Nothing else to configure.
//
// Optional, to hand sign-ups straight to an email-sending service instead, set in
// Cloudflare Pages → Settings → Variables and Secrets:
//   NEWSLETTER_PROVIDER = sender | buttondown | kit | mailerlite
//   NEWSLETTER_API_KEY  = (secret) API key
//   NEWSLETTER_LIST_ID  = Kit form ID, or MailerLite group ID (optional for MailerLite)

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;

export async function onRequestPost({ request, env }) {
  const wantsJson = (request.headers.get('accept') || '').includes('application/json');
  let email = '';
  let honeypot = '';
  try {
    const type = request.headers.get('content-type') || '';
    if (type.includes('application/json')) {
      const body = await request.json();
      email = String(body.email || '');
      honeypot = String(body.website || '');
    } else {
      const form = await request.formData();
      email = String(form.get('email') || '');
      honeypot = String(form.get('website') || '');
    }
  } catch {
    return reply(wantsJson, 400, 'Could not read the form');
  }

  email = email.trim().toLowerCase();
  if (honeypot) return reply(wantsJson, 200); // bots fill hidden fields; pretend success
  if (!EMAIL_RE.test(email)) return reply(wantsJson, 400, 'Please enter a valid email address');

  try {
    await subscribe(email, env, request);
    return reply(wantsJson, 200);
  } catch (err) {
    console.error('subscribe failed', err);
    return reply(wantsJson, err.status || 502, err.public || 'Sign-up failed, please try again');
  }
}

async function subscribe(email, env, request) {
  const provider = (env.NEWSLETTER_PROVIDER || (env.DB ? 'd1' : '')).toLowerCase();
  const key = env.NEWSLETTER_API_KEY;
  const list = env.NEWSLETTER_LIST_ID;

  if (provider === 'sender') {
    if (!env.DB || !key || !list) throw fail(503);
    let source = '/';
    try { source = new URL(request.headers.get('referer') || request.url).pathname; } catch {}
    await env.DB.prepare(
      'INSERT INTO subscribers (email, created_at, country, source) VALUES (?1, ?2, ?3, ?4) ON CONFLICT(email) DO NOTHING'
    ).bind(email, new Date().toISOString(), request.cf?.country || null, source).run();
    await syncSender(email, key, list);
    return;
  }

  if (provider === 'buttondown') {
    const res = await fetch('https://api.buttondown.com/v1/subscribers', {
      method: 'POST',
      headers: { Authorization: `Token ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email_address: email, referrer_url: request.headers.get('referer') || '' }),
    });
    // 400 with "already subscribed" is fine
    if (!res.ok && !(res.status === 400 && /already/i.test(await res.text()))) throw fail(res.status);
    return;
  }

  if (provider === 'kit') {
    const headers = { 'X-Kit-Api-Key': key, 'Content-Type': 'application/json' };
    const res = await fetch('https://api.kit.com/v4/subscribers', { method: 'POST', headers, body: JSON.stringify({ email_address: email }) });
    if (!res.ok) throw fail(res.status);
    if (list) {
      const r2 = await fetch(`https://api.kit.com/v4/forms/${encodeURIComponent(list)}/subscribers`, { method: 'POST', headers, body: JSON.stringify({ email_address: email }) });
      if (!r2.ok) throw fail(r2.status);
    }
    return;
  }

  if (provider === 'mailerlite') {
    const res = await fetch('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email, ...(list ? { groups: [list] } : {}) }),
    });
    if (!res.ok) throw fail(res.status);
    return;
  }

  if (provider === 'd1' && env.DB) {
    await env.DB.prepare(
      'INSERT INTO subscribers (email, created_at, country, source) VALUES (?1, ?2, ?3, ?4) ON CONFLICT(email) DO NOTHING'
    )
      .bind(email, new Date().toISOString(), request.cf?.country || null, new URL(request.headers.get('referer') || 'https://x/').pathname)
      .run();
    return;
  }

  const e = new Error('Newsletter provider not configured');
  e.status = 503;
  e.public = "Sign-ups aren't connected yet";
  throw e;
}

function fail(status) {
  const e = new Error(`provider responded ${status}`);
  e.status = 502;
  return e;
}

function reply(wantsJson, status, error) {
  const ok = status < 400;
  if (wantsJson) {
    return new Response(JSON.stringify(ok ? { ok, message: "You're on the list. See you Thursday!" } : { ok, error }), {
      status,
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
    });
  }
  // Plain form post (JavaScript disabled): go back to the page.
  return new Response(null, { status: 303, headers: { Location: ok ? '/?subscribed=1#newsletter' : '/?subscribe_error=1#newsletter' } });
}
