import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';

const SRC = existsSync('db-source.txt') ? 'db-source.txt' : 'legacy/db.txt';
const raw = readFileSync(SRC, 'utf8');
const seen = new Set();
const out = [];
for (const line of raw.split(/\r?\n/)) {
  const phrase = line.trim();
  if (!phrase) continue;
  if (phrase === 'CREATE_GEMATRO_DB') continue; // header sentinel
  const key = phrase.toLowerCase();
  if (seen.has(key)) continue; // legacy dedupes case-insensitively
  seen.add(key);
  out.push(phrase);
}
mkdirSync('public', { recursive: true });
writeFileSync('public/cyphers-db.txt', out.join('\n') + '\n');
console.log(`Wrote ${out.length} phrases to public/cyphers-db.txt`);
