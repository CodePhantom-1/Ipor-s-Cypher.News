// Ingest public-domain corpus → db-corpus.txt.
//   node scripts/corpus/ingest.mjs                 # all sources
//   node scripts/corpus/ingest.mjs --tag A-bedrock # one tier
//   node scripts/corpus/ingest.mjs --only quran,tao-te-ching
//   node scripts/corpus/ingest.mjs --limit 2000    # cap clauses/source (smoke test)
// Fetches are cached on disk, so re-runs and re-assembly are instant.
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { SOURCES } from './sources.mjs';
import { fetchCached, fetchArchiveText, htmlToText, stripGutenberg, toClauses, keyOf } from './lib.mjs';

const OUT = '.cache/corpus/out';
const args = process.argv.slice(2);
const flag = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const only = flag('--only')?.split(',');
const tag = flag('--tag');
const limit = +flag('--limit') || Infinity;

let picked = SOURCES.filter((s) => !s.skip);
if (only) picked = picked.filter((s) => only.includes(s.id));
if (tag) picked = picked.filter((s) => s.tag === tag);

async function getText(s) {
  if (s.txt) {
    const t = await fetchCached(s.txt);
    return { text: /gutenberg/i.test(s.txt) ? stripGutenberg(t) : t, identifier: s.txt };
  }
  if (s.html) return { text: htmlToText(await fetchCached(s.html)), identifier: s.html };
  return await fetchArchiveText(s.q); // { text, identifier }, validated
}

async function pool(items, n, fn) {
  const it = items[Symbol.iterator]();
  await Promise.all(Array.from({ length: n }, async () => {
    for (let x = it.next(); !x.done; x = it.next()) await fn(x.value);
  }));
}

mkdirSync(OUT, { recursive: true });
const report = [];
await pool(picked, 5, async (s) => {
  try {
    const { text, identifier } = await getText(s);
    let clauses = toClauses(text);
    if (clauses.length > limit) clauses = clauses.slice(0, limit);
    // de-dup within the source before writing (cheap, shrinks files)
    const seen = new Set(), uniq = [];
    for (const c of clauses) { const k = keyOf(c); if (!seen.has(k)) { seen.add(k); uniq.push(c); } }
    writeFileSync(`${OUT}/${s.id}.txt`, uniq.join('\n') + '\n');
    const idShort = String(identifier).replace(/^https?:\/\/[^/]+\//, '').slice(0, 28);
    report.push({ id: s.id, tag: s.tag, license: s.license, uniq: uniq.length, src: idShort, ok: true });
  } catch (e) {
    report.push({ id: s.id, tag: s.tag, license: s.license, ok: false, err: e.message });
  }
});

// ── assemble: global dedup of every cached source file against the existing DB ──
const existing = new Set();
for (const line of readFileSync('db-source.txt', 'utf8').split(/\r?\n/)) {
  const k = keyOf(line); if (k) existing.add(k);
}
const startedWith = existing.size;
const out = [];
for (const f of readdirSync(OUT).filter((f) => f.endsWith('.txt'))) {
  for (const line of readFileSync(`${OUT}/${f}`, 'utf8').split(/\r?\n/)) {
    const phrase = line.trim(); if (!phrase) continue;
    const k = keyOf(phrase);
    if (k && !existing.has(k)) { existing.add(k); out.push(phrase); }
  }
}
writeFileSync('db-corpus.txt', out.join('\n') + '\n');

// ── report ──
report.sort((a, b) => (a.tag + a.id).localeCompare(b.tag + b.id));
console.log('\nsource'.padEnd(22), 'tag'.padEnd(14), 'lic'.padEnd(7), 'uniq'.padStart(7), '  resolved');
for (const r of report) {
  if (r.ok) console.log(r.id.padEnd(22), r.tag.padEnd(14), r.license.padEnd(7), String(r.uniq).padStart(7), '  ' + r.src);
  else console.log(r.id.padEnd(22), r.tag.padEnd(14), r.license.padEnd(7), '   FAIL', '  ' + r.err);
}
const okN = report.filter((r) => r.ok).length;
const verify = report.filter((r) => r.ok && r.license === 'verify').map((r) => r.id);
console.log(`\n${okN}/${report.length} sources ok · existing DB ${startedWith} phrases`);
console.log(`db-corpus.txt: +${out.length} new unique phrases  →  ~${startedWith + out.length} total after build`);
if (verify.length) console.log(`⚠ license:verify (confirm English edition is free before publishing): ${verify.join(', ')}`);
