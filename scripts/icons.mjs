// Inline SVG icons (24×24). Brand marks are simplified, single-colour glyphs.
const S = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';

const ICONS = {
  play: '<path d="M8 5.5v13l11-6.5z"/>',
  pause: '<path d="M7 5h4v14H7zM13 5h4v14h-4z"/>',
  heart: '<path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.4 3 4.5 6.7 4.5c2.2 0 3.6 1.2 4.3 2.4h2c.7-1.2 2.1-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.2C19.5 16.4 12 21 12 21z"/>',
  arrow: `<path ${S} d="M5 12h14M13 6l6 6-6 6"/>`,
  arrowUp: `<path ${S} d="M7 17 17 7M8 7h9v9"/>`,
  menu: `<path ${S} d="M4 7h16M4 12h16M4 17h16"/>`,
  close: `<path ${S} d="M6 6l12 12M18 6 6 18"/>`,
  search: `<g ${S}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></g>`,
  back: `<path ${S} stroke-width="1.8" d="M4 12a8 8 0 1 0 2.6-5.9M4 4v4.5h4.5"/>`,
  fwd: `<path ${S} stroke-width="1.8" d="M20 12a8 8 0 1 1-2.6-5.9M20 4v4.5h-4.5"/>`,
  mail: `<g ${S}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></g>`,

  apple: `<g ${S} stroke-width="1.8"><path d="M7.2 18a8 8 0 1 1 9.6 0"/><path d="M9 14.9a4.2 4.2 0 1 1 6 0"/></g><circle cx="12" cy="11" r="1.9"/><path d="M10.5 14.6h3l-.6 6.4h-1.8z"/>`,
  spotify: `<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.8"/><g ${S} stroke-width="1.8"><path d="M6.8 9.4c3.5-1 7.4-.7 10.4.9"/><path d="M7.4 12.6c2.8-.8 5.9-.5 8.3.8"/><path d="M8 15.6c2.2-.5 4.4-.3 6.3.6"/></g>`,
  youtube: '<path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8zM9.8 15.1V8.9l5.6 3.1z"/>',
  rss: '<circle cx="5" cy="19" r="2.3"/><path d="M2.7 10.4v3.1a7.8 7.8 0 0 1 7.8 7.8h3.1A10.9 10.9 0 0 0 2.7 10.4zm0-6.6v3.1a14.4 14.4 0 0 1 14.4 14.4h3.1A17.5 17.5 0 0 0 2.7 3.8z"/>',
  rsscom: `<g ${S} stroke-width="1.8"><circle cx="12" cy="12" r="2"/><path d="M8.5 15.5a5 5 0 0 1 0-7M15.5 8.5a5 5 0 0 1 0 7M5.6 18.4a9 9 0 0 1 0-12.8M18.4 5.6a9 9 0 0 1 0 12.8"/></g>`,

  x: '<path d="M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.2-8.3L1.8 3h6.4l4.4 5.8zm-1.1 16.2h1.7L7.4 4.7H5.5z"/>',
  instagram: `<g ${S}><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/></g><circle cx="17.4" cy="6.6" r="1.2"/>`,
  tiktok: '<path d="M16.6 2h-3.4v13.4a2.9 2.9 0 1 1-2.9-2.9c.3 0 .6 0 .8.1V9.1a6.4 6.4 0 1 0 5.5 6.3V8.6a8 8 0 0 0 4.6 1.5V6.7a4.7 4.7 0 0 1-4.6-4.7z"/>',
  facebook: '<path d="M14 8.5V6.8c0-.8.5-1 1-1h2.5V2.1L14.6 2C11.4 2 10.5 4.2 10.5 6.3v2.2H8V12h2.5v10H14V12h3l.5-3.5z"/>',

  paypal: `<g ${S} stroke-width="1.9"><path d="M7.5 20H4.3L7 3.5h6.2c3.1 0 4.9 1.6 4.4 4.4-.5 3-2.7 4.6-5.8 4.6H9.2z"/><path d="M10.4 20.5h-2.6M18.7 8.4c1.4.7 2 2.1 1.7 3.9-.5 3-2.7 4.6-5.8 4.6h-2.3l-.8 4"/></g>`,
  patreon: '<circle cx="14.6" cy="9.6" r="6.6"/><rect x="2.8" y="3" width="3.6" height="18" rx=".6"/>',
  venmo: `<path ${S} stroke-width="2.6" d="M4.5 5.5 8.3 19h3.4c3.1-4.4 6.3-9.4 6.3-12.9 0-1-.2-1.7-.6-2.3"/>`,
  bitcoin: '<circle cx="12" cy="12" r="11"/><path fill="#0e0d0b" d="M15.9 10.6c.2-1.5-.9-2.3-2.5-2.8l.5-2-1.2-.3-.5 2-1-.2.5-2-1.2-.3-.5 2-.8-.2-1.7-.4-.3 1.3s.9.2.9.2c.5.1.6.5.6.7l-1.4 5.6c-.1.2-.3.4-.6.3l-.9-.2-.6 1.4 1.6.4.9.2-.5 2.1 1.2.3.5-2 1 .2-.5 2 1.2.3.5-2.1c2.1.4 3.7.2 4.4-1.7.5-1.5 0-2.4-1.1-3 .8-.2 1.4-.7 1.5-1.8zm-2.8 3.9c-.4 1.5-2.9.7-3.7.5l.7-2.7c.8.2 3.4.6 3 2.2zm.4-4c-.3 1.4-2.4.7-3.1.5l.6-2.4c.7.2 2.9.5 2.5 1.9z"/>',
};

export function icon(name, cls = '') {
  const body = ICONS[name];
  if (!body) throw new Error(`Unknown icon "${name}"`);
  const c = ['i', `i-${name}`, cls].filter(Boolean).join(' ');
  return `<svg class="${c}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${body}</svg>`;
}
