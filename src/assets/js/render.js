// Episode markup, shared by the build script (Node) and the browser.
// Keep this file dependency-free.

export const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// RSS.com serves resized artwork from img.rss.com/<show>/<size>/<file>
export function artUrl(url, size = 600) {
  const m = (url || '').match(/^https:\/\/media\.rss\.com\/([^/]+)\/([^/?#]+)$/);
  return m ? `https://img.rss.com/${m[1]}/${size}/${m[2]}` : url;
}

export function fmtDate(iso, opts = { month: 'short', day: 'numeric', year: 'numeric' }) {
  return new Date(iso).toLocaleDateString('en-US', { ...opts, timeZone: 'America/Los_Angeles' });
}

export function fmtTime(sec = 0) {
  sec = Math.max(0, Math.floor(sec));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}

export function fmtDuration(sec = 0) {
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  return h ? `${h} hr ${m} min` : `${m} min`;
}

const epLabel = (ep) => (ep.number != null ? `Ep. ${ep.number}` : 'Episode');

// Data attributes the player reads when a play button is clicked.
export const playAttrs = (ep) =>
  `data-play="${esc(ep.id)}" data-src="${esc(ep.audio)}" data-title="${esc(ep.name)}" data-num="${esc(epLabel(ep))}" data-art="${esc(artUrl(ep.image, 160))}" data-duration="${ep.duration}"`;

const PLAY_ICON = '<svg class="i-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg><svg class="i-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>';

export function episodeCard(ep, { eager = false } = {}) {
  return `<article class="ep-card" id="ep-${ep.number ?? esc(ep.id)}">
  <a class="ep-card__art" href="/episodes/#ep-${ep.number ?? esc(ep.id)}" tabindex="-1" aria-hidden="true">
    <img src="${esc(artUrl(ep.image, 300))}" srcset="${esc(artUrl(ep.image, 300))} 300w, ${esc(artUrl(ep.image, 600))} 600w" sizes="(max-width: 640px) 90vw, 300px" width="300" height="300" alt="" ${eager ? '' : 'loading="lazy"'} decoding="async">
  </a>
  <div class="ep-card__body">
    <p class="meta"><span>${esc(epLabel(ep))}</span><span>${esc(fmtDate(ep.date))}</span><span>${esc(fmtDuration(ep.duration))}</span></p>
    <h3 class="ep-card__title"><a href="/episodes/#ep-${ep.number ?? esc(ep.id)}">${esc(ep.name)}</a></h3>
    <p class="ep-card__sum">${esc(ep.summary)}</p>
    <button class="btn-play" type="button" ${playAttrs(ep)} aria-label="Play ${esc(epLabel(ep))}: ${esc(ep.name)}">${PLAY_ICON}<span>Play</span></button>
  </div>
</article>`;
}

function timestampsList(ep, max = Infinity) {
  if (!ep.timestamps?.length) return '';
  const items = ep.timestamps.slice(0, max);
  return `<ol class="chapters">${items
    .map(
      (t) =>
        `<li><button type="button" class="chapter" data-seek="${t.t}"><span class="chapter__t">${esc(fmtTime(t.t))}</span><span class="chapter__l">${esc(t.label)}</span></button></li>`
    )
    .join('')}</ol>`;
}

export function latestEpisode(ep) {
  return `<div class="latest" data-ep-scope data-latest-id="${esc(ep.id)}">
  <figure class="latest__art">
    <img src="${esc(artUrl(ep.image, 600))}" srcset="${esc(artUrl(ep.image, 600))} 600w, ${esc(artUrl(ep.image, 900))} 900w" sizes="(max-width: 860px) 90vw, 480px" width="600" height="600" alt="Cover art for NO ID ${esc(epLabel(ep))}: ${esc(ep.name)}" fetchpriority="high">
  </figure>
  <div class="latest__body">
    <p class="meta"><span class="tag-new">New</span><span>${esc(epLabel(ep))}</span><span>${esc(fmtDate(ep.date, { weekday: 'long', month: 'long', day: 'numeric' }))}</span><span>${esc(fmtDuration(ep.duration))}</span></p>
    <h3 class="latest__title">${esc(ep.name)}</h3>
    <p class="latest__sum">${esc(ep.summary)}</p>
    <div class="latest__actions">
      <button class="btn btn--red btn-play" type="button" ${playAttrs(ep)}>${PLAY_ICON}<span>Play episode</span></button>
      <a class="btn btn--ghost" href="/episodes/#ep-${ep.number ?? esc(ep.id)}">Show notes</a>
      <a class="link-quiet" href="${esc(ep.audio)}" download>Download MP3</a>
    </div>
    ${ep.producers?.length ? `<p class="latest__producers"><span>Executive producers</span> ${ep.producers.map(esc).join(' · ')}</p>` : ''}
    ${ep.timestamps?.length ? `<details class="latest__chapters"><summary>In this episode <span>${ep.timestamps.length} segments</span></summary>${timestampsList(ep)}</details>` : ''}
  </div>
</div>`;
}

export function episodeRow(ep) {
  const n = ep.number ?? esc(ep.id);
  return `<article class="ep-row" id="ep-${n}" data-ep-scope>
  <img class="ep-row__art" src="${esc(artUrl(ep.image, 300))}" width="150" height="150" alt="" loading="lazy" decoding="async">
  <div class="ep-row__body">
    <p class="meta"><span>${esc(epLabel(ep))}</span><span>${esc(fmtDate(ep.date))}</span><span>${esc(fmtDuration(ep.duration))}</span></p>
    <h2 class="ep-row__title">${esc(ep.name)}</h2>
    <p class="ep-row__sum">${esc(ep.summary)}</p>
    <div class="ep-row__actions">
      <button class="btn btn--red btn--sm btn-play" type="button" ${playAttrs(ep)}>${PLAY_ICON}<span>Play</span></button>
      <a class="link-quiet" href="${esc(ep.audio)}" download>MP3</a>
      ${ep.transcript ? `<a class="link-quiet" href="${esc(ep.transcript)}" target="_blank" rel="noopener">Transcript</a>` : ''}
      <button class="link-quiet share" type="button" data-share="#ep-${n}" data-share-title="NO ID ${esc(epLabel(ep))}: ${esc(ep.name)}">Share</button>
    </div>
    <details class="notes"><summary>Show notes${ep.timestamps.length ? ` &amp; ${ep.timestamps.length} timestamps` : ''}</summary>
      ${timestampsList(ep)}
      <div class="notes__html">${ep.notesHtml}</div>
    </details>
  </div>
</article>`;
}
