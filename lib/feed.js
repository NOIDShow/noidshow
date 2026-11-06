// Shared RSS parser for the NO ID feed.
// Runs in Node (build script) and in Cloudflare Workers (Pages Function) —
// no DOM, no dependencies, so it is regex-based and tuned for RSS.com feeds.

export const FEED_URL = 'https://media.rss.com/noid/feed.xml';

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

export function decodeEntities(s = '') {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') {
      const n = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : m;
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

function unCdata(s = '') {
  const m = s.match(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/);
  return m ? m[1] : decodeEntities(s);
}

function tag(xml, name) {
  const re = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i');
  const m = xml.match(re);
  return m ? unCdata(m[1]).trim() : '';
}

function attr(xml, name, attribute) {
  const re = new RegExp(`<${name}\\s[^>]*?${attribute}="([^"]*)"`, 'i');
  const m = xml.match(re);
  return m ? decodeEntities(m[1]) : '';
}

const escapeHtml = (s = '') =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const stripTags = (html = '') =>
  decodeEntities(html.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();

// Keep a small, safe subset of HTML for show notes.
const ALLOWED = new Set(['p', 'a', 'strong', 'b', 'em', 'i', 'br', 'ul', 'ol', 'li']);
export function sanitizeHtml(html = '') {
  return html
    .replace(/<(script|style|iframe|object)[\s\S]*?<\/\1>/gi, '')
    .replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (m, t, attrs) => {
      t = t.toLowerCase();
      if (!ALLOWED.has(t)) return '';
      if (m.startsWith('</')) return `</${t}>`;
      if (t === 'a') {
        const href = (attrs.match(/href="([^"]*)"/i) || [])[1] || '';
        const url = decodeEntities(href).trim();
        if (!/^(https?:|mailto:)/i.test(url)) return '<a>';
        return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener nofollow">`;
      }
      return `<${t}>`;
    })
    .replace(/<p>\s*<\/p>/g, '');
}

function toSeconds(d = '') {
  if (/^\d+$/.test(d)) return parseInt(d, 10);
  return d.split(':').reduce((acc, p) => acc * 60 + (parseInt(p, 10) || 0), 0);
}

const TS_RE = /^\(?\s*((?:\d{1,2}:)?\d{1,3}:\d{2})\s*\)?\s*[-–—:]?\s*(.+)$/;

function parseNotes(html) {
  const paras = [...html.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map((m) => m[1]);
  const timestamps = [];
  const producers = [];
  let section = '';
  let summary = '';
  for (const raw of paras) {
    const text = stripTags(raw);
    if (!text) continue;
    const heading = /^<strong>[^<]*<\/strong>\s*:?\s*$/i.test(raw.trim()) || /^[A-Za-z -]{3,40}:$/.test(text);
    if (heading) {
      section = text.toLowerCase().replace(/:$/, '');
      continue;
    }
    const ts = text.match(TS_RE);
    if (ts) {
      timestamps.push({ t: toSeconds(ts[1]), label: ts[2].trim() });
      continue;
    }
    if (/producer/.test(section) && text.length < 80) {
      producers.push(...text.split(/\s*[,;]\s*/).filter(Boolean));
      continue;
    }
    if (!summary && text.length > 140 && !/value[- ]?(4|for)[- ]?value/i.test(text.slice(0, 40))) summary = text;
  }
  return { timestamps, producers, summary };
}

export function parseFeed(xml) {
  const channel = xml.split(/<item>/i)[0];
  const show = {
    title: tag(channel, 'title'),
    description: stripTags(tag(channel, 'description')),
    image: attr(channel, 'itunes:image', 'href'),
  };
  const items = xml.split(/<item>/i).slice(1).map((chunk) => chunk.split(/<\/item>/i)[0]);
  const episodes = items.map((it) => {
    const title = tag(it, 'title');
    const numMatch = title.match(/^\s*(\d+)\s*[-–—:|.]\s*(.+)$/);
    const epTag = tag(it, 'itunes:episode');
    const descHtml = tag(it, 'content:encoded') || tag(it, 'description');
    const notesHtml = sanitizeHtml(descHtml);
    const { timestamps, producers, summary } = parseNotes(notesHtml);
    const image = attr(it, 'itunes:image', 'href') || show.image;
    return {
      id: tag(it, 'guid'),
      title,
      number: epTag ? parseInt(epTag, 10) : numMatch ? parseInt(numMatch[1], 10) : null,
      name: numMatch ? numMatch[2].trim() : title,
      date: new Date(tag(it, 'pubDate')).toISOString(),
      duration: toSeconds(tag(it, 'itunes:duration')),
      audio: attr(it, 'enclosure', 'url'),
      link: tag(it, 'link'),
      image,
      transcript: attr(it, 'podcast:transcript', 'url'),
      summary: summary || stripTags(notesHtml).slice(0, 320),
      timestamps,
      producers,
      notesHtml,
    };
  });
  episodes.sort((a, b) => b.date.localeCompare(a.date));
  return { show, episodes, fetchedAt: new Date().toISOString() };
}
