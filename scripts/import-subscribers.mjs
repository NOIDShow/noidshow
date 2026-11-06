// Turn an exported subscriber list (CSV or plain text from GoDaddy, Mailchimp, a spreadsheet…)
// into SQL you can paste into the Cloudflare D1 console.
//
//   node scripts/import-subscribers.mjs path/to/export.csv
//
// It finds every email address in the file (whatever the column layout), de-duplicates them,
// and writes db/import-subscribers.sql. Each statement adds up to 400 addresses and skips any
// that are already in the database, so it's safe to run more than once.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/import-subscribers.mjs path/to/export.csv');
  process.exit(1);
}

const raw = await readFile(file, 'utf8');
const found = raw.match(/[A-Z0-9._%+'-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [];
const emails = [...new Set(found.map((e) => e.toLowerCase().replace(/^['.]+|['.]+$/g, '')))].sort();

if (!emails.length) {
  console.error('No email addresses found in that file.');
  process.exit(1);
}

const now = new Date().toISOString();
const q = (s) => `'${s.replace(/'/g, "''")}'`;
const chunks = [];
for (let i = 0; i < emails.length; i += 400) {
  const rows = emails.slice(i, i + 400).map((e) => `(${q(e)}, ${q(now)}, NULL, 'import')`).join(',\n');
  chunks.push(`INSERT INTO subscribers (email, created_at, country, source) VALUES\n${rows}\nON CONFLICT(email) DO NOTHING;`);
}

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'db', 'import-subscribers.sql');
await mkdir(dirname(out), { recursive: true });
await writeFile(out, chunks.join('\n\n') + '\n');

console.log(`✓ ${emails.length} unique email addresses → db/import-subscribers.sql (${chunks.length} statement${chunks.length > 1 ? 's' : ''})`);
console.log('  Paste it into Cloudflare → D1 → noid → Console, one statement at a time,');
console.log('  or run: npx wrangler d1 execute noid --remote --file=db/import-subscribers.sql');
console.log('  (This file contains personal data. It is git-ignored, so delete it when you are done.)');
