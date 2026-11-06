import { artUrl, fmtTime, episodeCard, latestEpisode, episodeRow, playAttrs } from './render.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
};

/* ---------------- toast ---------------- */
let toastEl, toastTimer;
function toast(msg) {
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.className = 'toast';
    toastEl.setAttribute('role', 'status');
    document.body.append(toastEl);
  }
  toastEl.textContent = msg;
  toastEl.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), 2400);
}

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch {
    const ta = Object.assign(document.createElement('textarea'), { value: text });
    document.body.append(ta); ta.select();
    const ok = document.execCommand('copy'); ta.remove(); return ok;
  }
}

/* ---------------- header ---------------- */
const header = $('.site-header');
const onScroll = () => header?.classList.toggle('is-scrolled', scrollY > 8);
addEventListener('scroll', onScroll, { passive: true });
onScroll();

const menuBtn = $('.menu-btn');
const nav = $('#nav');
menuBtn?.addEventListener('click', () => {
  const open = nav.classList.toggle('is-open');
  menuBtn.setAttribute('aria-expanded', String(open));
});
nav?.addEventListener('click', (e) => {
  if (e.target.closest('a')) { nav.classList.remove('is-open'); menuBtn?.setAttribute('aria-expanded', 'false'); }
});

/* ---------------- reveal ---------------- */
const io = 'IntersectionObserver' in window
  ? new IntersectionObserver((entries) => entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -8% 0px' })
  : null;
$$('.reveal').forEach((el) => (io ? io.observe(el) : el.classList.add('is-in')));

/* ---------------- player ---------------- */
const P = $('[data-player]');
const audio = $('[data-p-audio]');
const seek = $('[data-p-seek]');
const SPEEDS = [1, 1.25, 1.5, 1.75, 2, 0.8];
let current = null; // { id, src, title, num, art, duration }
let lastSave = 0;

function syncButtons() {
  const playing = !audio.paused;
  P.classList.toggle('is-playing', playing);
  $$('.btn-play[data-play]').forEach((b) => {
    const on = playing && current && b.dataset.play === current.id;
    b.classList.toggle('is-playing', on);
    const label = b.querySelector('span');
    if (label && b.dataset.label == null) b.dataset.label = label.textContent;
    if (label) label.textContent = on ? 'Pause' : b.dataset.label;
  });
}

function openPlayer() {
  P.hidden = false;
  requestAnimationFrame(() => P.classList.add('is-open'));
  document.body.style.setProperty('--player-h', `${P.offsetHeight + 20}px`);
}

function load(d, seekTo) {
  current = { id: d.play, src: d.src, title: d.title, num: d.num, art: d.art, duration: +d.duration || 0 };
  audio.src = d.src;
  $('[data-p-title]').textContent = d.title;
  $('[data-p-num]').textContent = d.num;
  $('[data-p-art]').src = d.art;
  $('[data-p-dur]').textContent = fmtTime(current.duration);
  const saved = +store.get(`noid:pos:${d.play}`) || 0;
  const start = seekTo != null ? seekTo : saved > 30 && saved < current.duration - 60 ? saved : 0;
  if (start) {
    audio.addEventListener('loadedmetadata', () => { audio.currentTime = start; }, { once: true });
  }
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: d.title, artist: 'NO ID', album: `${d.num} · NO ID podcast`,
      artwork: [{ src: d.art.replace('/160/', '/600/'), sizes: '600x600', type: 'image/jpeg' }],
    });
  }
}

function play(d, seekTo) {
  if (!current || current.id !== d.play) load(d, seekTo);
  else if (seekTo != null) audio.currentTime = seekTo;
  openPlayer();
  audio.play().catch(() => {});
}

document.addEventListener('click', (e) => {
  const ch = e.target.closest('.chapter[data-seek]');
  const b = ch ? ch.closest('[data-ep-scope]')?.querySelector('.btn-play[data-play]') : e.target.closest('[data-play]');
  if (!b) return;
  e.preventDefault();
  const seekTo = ch ? +ch.dataset.seek : null;
  if (current && current.id === b.dataset.play && seekTo == null && !audio.paused) { audio.pause(); return; }
  play(b.dataset, seekTo);
});

$('[data-p-toggle]')?.addEventListener('click', () => (audio.paused ? audio.play() : audio.pause()));
$$('[data-p-skip]').forEach((b) => b.addEventListener('click', () => { audio.currentTime = Math.max(0, audio.currentTime + +b.dataset.pSkip); }));
$('[data-p-close]')?.addEventListener('click', () => {
  audio.pause();
  P.classList.remove('is-open');
  document.body.style.removeProperty('--player-h');
  setTimeout(() => { if (!P.classList.contains('is-open')) P.hidden = true; }, 450);
});
const speedBtn = $('[data-p-speed]');
speedBtn?.addEventListener('click', () => {
  const i = (SPEEDS.indexOf(audio.playbackRate) + 1) % SPEEDS.length;
  audio.playbackRate = SPEEDS[i];
  speedBtn.textContent = `${SPEEDS[i]}×`;
  store.set('noid:speed', SPEEDS[i]);
});
const savedSpeed = +store.get('noid:speed');
if (audio && SPEEDS.includes(savedSpeed)) {
  audio.addEventListener('play', () => { if (audio.playbackRate !== savedSpeed && !audio.dataset.sp) { audio.playbackRate = savedSpeed; audio.dataset.sp = 1; speedBtn.textContent = `${savedSpeed}×`; } });
}

let seeking = false;
seek?.addEventListener('input', () => {
  seeking = true;
  const dur = audio.duration || current?.duration || 0;
  $('[data-p-cur]').textContent = fmtTime((seek.value / 1000) * dur);
  seek.style.setProperty('--p', `${seek.value / 10}%`);
});
seek?.addEventListener('change', () => {
  const dur = audio.duration || current?.duration || 0;
  audio.currentTime = (seek.value / 1000) * dur;
  seeking = false;
});
if (seek) seek.max = 1000;

audio?.addEventListener('timeupdate', () => {
  const dur = audio.duration || current?.duration || 0;
  if (!seeking && dur) {
    seek.value = Math.round((audio.currentTime / dur) * 1000);
    seek.style.setProperty('--p', `${(audio.currentTime / dur) * 100}%`);
    $('[data-p-cur]').textContent = fmtTime(audio.currentTime);
  }
  if (current && Date.now() - lastSave > 5000) { lastSave = Date.now(); store.set(`noid:pos:${current.id}`, Math.floor(audio.currentTime)); }
});
audio?.addEventListener('loadedmetadata', () => { $('[data-p-dur]').textContent = fmtTime(audio.duration); });
audio?.addEventListener('play', syncButtons);
audio?.addEventListener('pause', syncButtons);
audio?.addEventListener('ended', () => { if (current) store.set(`noid:pos:${current.id}`, 0); syncButtons(); });

if ('mediaSession' in navigator && audio) {
  const ms = navigator.mediaSession;
  ms.setActionHandler('play', () => audio.play());
  ms.setActionHandler('pause', () => audio.pause());
  ms.setActionHandler('seekbackward', () => { audio.currentTime -= 15; });
  ms.setActionHandler('seekforward', () => { audio.currentTime += 30; });
}

addEventListener('keydown', (e) => {
  if (e.code !== 'Space' || !current || e.target.closest('input, textarea, button, a, summary, [contenteditable]')) return;
  e.preventDefault();
  audio.paused ? audio.play() : audio.pause();
});

/* ---------------- copy & share ---------------- */
document.addEventListener('click', async (e) => {
  const c = e.target.closest('[data-copy]');
  if (c) {
    if (await copyText(c.dataset.copy)) {
      toast(c.dataset.copyMsg || 'Copied');
      if (c.classList.contains('copy')) { c.textContent = 'Copied'; c.classList.add('is-done'); setTimeout(() => { c.textContent = 'Copy'; c.classList.remove('is-done'); }, 2000); }
    }
    return;
  }
  const s = e.target.closest('[data-share]');
  if (s) {
    const url = `${location.origin}/episodes/${s.dataset.share}`;
    if (navigator.share) { navigator.share({ title: s.dataset.shareTitle, url }).catch(() => {}); }
    else if (await copyText(url)) toast('Episode link copied');
  }
});

/* ---------------- newsletter ---------------- */
$$('[data-newsletter]').forEach((form) => {
  const status = $('.nl-status', form);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('button[type=submit]', form);
    const email = form.email.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { status.className = 'nl-status err'; status.textContent = 'Please enter a valid email address.'; return; }
    btn.disabled = true; btn.textContent = 'Sending…';
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ email, website: form.website.value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) throw new Error(data.error || 'Something went wrong');
      status.className = 'nl-status ok';
      status.textContent = data.message || "You're on the list. See you Thursday!";
      form.reset();
    } catch (err) {
      status.className = 'nl-status err';
      status.textContent = `${err.message}. You can also email us at noidpod@gmail.com.`;
    } finally {
      btn.disabled = false; btn.textContent = 'Subscribe';
    }
  });
});
const qs = new URLSearchParams(location.search);
if (qs.has('subscribed')) toast("You're on the list. See you Thursday!");
if (qs.has('subscribe_error')) toast('Sign-up failed. Please try again or email us.');

/* ---------------- episodes page: search + deep links ---------------- */
const list = $('[data-slot="list"]');
function openHashEpisode() {
  const el = location.hash.startsWith('#ep-') && document.getElementById(location.hash.slice(1));
  const notes = el && $('details.notes', el);
  if (notes) notes.open = true;
}
if (list) {
  openHashEpisode();
  addEventListener('hashchange', openHashEpisode);
  const input = $('[data-search-input]');
  const count = $('[data-search-count]');
  const empty = $('[data-search-empty]');
  const run = () => {
    const terms = input.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    let n = 0;
    $$('.ep-row', list).forEach((row) => {
      row._q ??= row.textContent.toLowerCase().replace(/\s+/g, ' ');
      const hit = terms.every((t) => row._q.includes(t));
      row.classList.toggle('is-hidden', !hit);
      if (hit) n++;
    });
    count.textContent = `${n} episode${n === 1 ? '' : 's'}`;
    empty.hidden = n > 0;
  };
  input?.addEventListener('input', run);
  const q = new URLSearchParams(location.search).get('q');
  if (q && input) { input.value = q; run(); }
}

/* ---------------- live refresh: pick up episodes published after the last deploy ---------------- */
const latestSlot = $('[data-slot="latest"]');
if (latestSlot || list) {
  const shownId = $('[data-latest-id]')?.dataset.latestId || $('.ep-row [data-play]')?.dataset.play;
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1200));
  idle(async () => {
    try {
      const res = await fetch(`/api/episodes?limit=${list ? 0 : 7}`, { headers: { accept: 'application/json' } });
      if (!res.ok) return;
      const { episodes, count } = await res.json();
      if (!episodes?.length || episodes[0].id === shownId) return;
      const [latest] = episodes;
      $$('[data-slot="count"]').forEach((el) => (el.textContent = count || episodes.length));
      if (latestSlot) {
        latestSlot.innerHTML = latestEpisode(latest);
        const recent = $('[data-slot="recent"]');
        if (recent) recent.innerHTML = episodes.slice(1, 7).map((e) => episodeCard(e)).join('');
        const heroBtn = $('.hero .btn-play');
        if (heroBtn) {
          const tmp = document.createElement('div');
          tmp.innerHTML = `<b ${playAttrs(latest)}></b>`;
          Object.assign(heroBtn.dataset, tmp.firstChild.dataset);
        }
        const top = $('.stack__card:last-of-type img');
        if (top) { top.srcset = ''; top.src = artUrl(latest.image, 600); top.alt = `Cover art for the latest NO ID episode: ${latest.name}`; }
        const badge = $('.stack__badge');
        if (badge) { $('small', badge).textContent = `New · Ep. ${latest.number ?? ''}`; $('b', badge).textContent = latest.name; }
      }
      if (list) {
        list.innerHTML = episodes.map(episodeRow).join('');
        const cnt = $('[data-search-count]');
        if (cnt) cnt.textContent = `${count || episodes.length} episodes`;
        openHashEpisode();
      }
      syncButtons();
    } catch {}
  });
}
