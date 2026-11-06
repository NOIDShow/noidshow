// ─────────────────────────────────────────────────────────────
//  NO ID — site settings. Edit links here; they flow into every page.
//  Leave a url as '' to hide that button.
// ─────────────────────────────────────────────────────────────
export default {
  url: 'https://noidshow.com',
  name: 'NO ID',
  tagline: "Idaho's mainstream media, deconstructed.",
  description:
    "NO ID is Idaho's independent, listener-supported podcast. Paul Banducci & Scott Moskowitz deconstruct the mainstream media narratives shaping North Idaho and the Inland Northwest. New episodes every Thursday.",
  hosts: 'Paul Banducci & Scott Moskowitz',
  email: 'noidpod@gmail.com',
  voicemail: 'https://speakpipe.com/noidshow',
  feed: 'https://media.rss.com/noid/feed.xml',

  // Where to listen. Order = display order.
  listen: [
    { id: 'apple', label: 'Apple Podcasts', url: 'https://podcasts.apple.com/us/podcast/no-id/id1845879197' },
    { id: 'spotify', label: 'Spotify', url: '' }, // ← add your Spotify show URL
    { id: 'youtube', label: 'YouTube', url: 'https://www.youtube.com/@noidshow' },
    { id: 'rsscom', label: 'RSS.com', url: 'https://rss.com/podcasts/noid/' },
    { id: 'rss', label: 'RSS Feed', url: 'https://media.rss.com/noid/feed.xml' },
  ],

  socials: [
    { id: 'youtube', label: 'YouTube', url: 'https://www.youtube.com/@noidshow' },
    { id: 'x', label: 'X', url: 'https://x.com/thenoidshow' },
    { id: 'instagram', label: 'Instagram', url: 'https://www.instagram.com/thenoidshow/' },
    { id: 'tiktok', label: 'TikTok', url: 'https://www.tiktok.com/@thenoidshow' },
    { id: 'facebook', label: 'Facebook', url: 'https://www.facebook.com/noidshow/' },
  ],

  donate: {
    paypal: 'https://www.paypal.com/ncp/payment/4AZ9NCBJ9QMV2',
    patreon: 'https://patreon.com/NOIDSHOW',
    venmo: 'https://venmo.com/noidshow?txn=pay',
    bitcoin: 'bc1qjepexp6ht0xm2rup9t9hy6lcwnrsq4qaw0qaqy',
  },

  // "Donation inspiration for producers"
  tiers: [
    { name: 'Shiny Schmeckle', amount: '9.99', note: 'A proper knob-polishing.' },
    { name: 'A Row of Ducks', amount: '22.22', note: 'Quack quack quack, Mr. Ducksworth.' },
    { name: 'No Agenda', amount: '33.33', note: 'Paying homage to the mothership.' },
    { name: 'The Sixty-Nine', amount: '69', note: "We'll explain when you're older." },
    { name: 'A Row of Schmeckles', amount: '111.11', note: "Line 'em up, smallest to biggest." },
  ],

  foundingDonors: [
    'Cyrus W', 'Sir Spook of Spokane', 'Dame Gen with a G', 'Jack Cramer', 'Kevin Killian',
    'Sir Donald of the Firebottles', 'Kris with a K', 'Lloyd the Brewer', 'Christopher Witzel',
    'Sir Dan the Quiet Man', 'E-Man', 'Reb the Cowgirl', 'Dave McPherson', 'Brian Molony',
    'Ainsley J', 'Mark Ellison', 'Cryptslapper of CDA', 'Tony Alvarez',
  ],
};
