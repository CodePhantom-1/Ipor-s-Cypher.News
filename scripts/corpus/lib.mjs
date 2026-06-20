// Shared corpus-ingest helpers: fetch+cache, text extraction, clause splitting,
// and the normalized dedup key. Pure + stdlib only. Run directly for a self-check.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const CACHE = '.cache/corpus';
const UA = 'gematro-corpus/1.0 (public-domain text research)';

/** fetch a URL once, then serve from disk forever (instant, polite re-runs). */
export async function fetchCached(url) {
  mkdirSync(CACHE, { recursive: true });
  const f = `${CACHE}/${createHash('sha1').update(url).digest('hex')}.txt`;
  if (existsSync(f)) return readFileSync(f, 'utf8');
  const r = await fetch(url, { headers: { 'user-agent': UA }, redirect: 'follow' });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const t = await r.text();
  writeFileSync(f, t);
  return t;
}

const STOP = new Set(['and', 'or', 'the', 'of', 'on', 'in', 'mediatype', 'texts', 'volume']);
/** Significant tokens from a query — used to verify a candidate really is this work. */
export function queryTokens(q) {
  return [...new Set(q.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/)
    .filter((t) => t.length >= 4 && !STOP.has(t)))];
}

const usedIds = new Set(); // a work resolved by one source can't be reused by another

/** Fetch the actual public-domain full text of a work from archive.org, validating
 *  the match: relevance-ranked, title/author must overlap, size-capped, not restricted,
 *  and downloadable. Returns { text, identifier } or throws. */
export async function fetchArchiveText(query, { maxBytes = 6_000_000 } = {}) {
  const tokens = queryTokens(query);
  const longest = tokens.slice().sort((a, b) => b.length - a.length)[0]; // most distinctive
  const api =
    'https://archive.org/advancedsearch.php?q=' +
    encodeURIComponent(`(${query}) AND mediatype:texts AND language:(English OR eng)`) +
    '&fl[]=identifier&rows=12&output=json'; // relevance order (no downloads sort)
  const docs = JSON.parse(await fetchCached(api))?.response?.docs ?? [];
  for (const d of docs) {
    if (usedIds.has(d.identifier)) continue;
    let meta;
    try { meta = JSON.parse(await fetchCached(`https://archive.org/metadata/${d.identifier}`)); }
    catch { continue; }
    const m = meta.metadata ?? {};
    if (String(m['access-restricted-item']).toLowerCase() === 'true') continue;
    // the item's title+author must really be this work: the marquee token, or
    // (when that sits in an OR branch a given edition drops) ≥3 strong tokens.
    const hay = `${m.title ?? ''} ${[].concat(m.creator ?? []).join(' ')}`.toLowerCase();
    const hits = tokens.filter((t) => hay.includes(t)).length;
    if (hits < 2 || (!hay.includes(longest) && hits < 3)) continue;
    const files = meta.files ?? [];
    const f =
      files.find((x) => /_djvu\.txt$/i.test(x.name)) ||
      files.find((x) => /\.txt$/i.test(x.name) && !/_(meta|files|cdx|chocr)/i.test(x.name));
    if (!f || (f.size && +f.size > maxBytes)) continue; // skip junk-large mis-resolutions
    try {
      const text = await fetchCached(`https://archive.org/download/${d.identifier}/${encodeURIComponent(f.name)}`);
      usedIds.add(d.identifier);
      return { text, identifier: d.identifier };
    } catch { /* restricted/unavailable — next */ }
  }
  throw new Error('no matching archive text');
}

const fold = (s) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '');

export function stripGutenberg(t) {
  const a = t.search(/\*\*\* ?START OF/i);
  const b = t.search(/\*\*\* ?END OF/i);
  return a >= 0 && b > a ? t.slice(t.indexOf('\n', a) + 1, b) : t;
}

export function htmlToText(h) {
  return h
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
    .replace(/&#3[49];|&[lr]squo;/gi, "'").replace(/&quot;|&[lr]dquo;/gi, '"')
    .replace(/&[a-z0-9#]+;/gi, ' ');
}

/** One coherent clause → Title Case, letters/apostrophe/ampersand only, or '' if rejected. */
function cleanClause(s) {
  s = fold(s)
    .replace(/\[[^\]]*\]|\{[^}]*\}/g, ' ') // footnote markers
    .replace(/[0-9]+/g, ' ')               // verse numbers / OCR digits
    .replace(/[^A-Za-z'& ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!s) return '';
  // strip edge apostrophes (OCR leaves stray ones); keep internal ones (don't, it's)
  const words = s.split(' ').map((w) => w.replace(/^'+|'+$/g, '')).filter(Boolean);
  if (words.length < 2 || words.length > 8) return '';          // single words already in DB
  if (words.some((w) => w.length > 16)) return '';              // OCR run-ons
  for (const w of words) {
    const lw = w.toLowerCase();
    if (w.length === 1) { if (lw !== 'a' && lw !== 'i' && w !== '&') return ''; } // stray single letters
    else if (!/[aeiouy]/.test(lw)) return '';                   // vowelless OCR blob (Pl, Tk, Apol→ok)
  }
  if (words.filter((w) => w.length === 1).length > words.length / 2) return ''; // 1-letter spam
  const letters = words.join('').replace(/[^A-Za-z]/g, '').length;
  if (letters < 5 || letters > 48) return '';
  return words.map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

/** Split a block of prose into coherent gematria-sized clauses. */
export function toClauses(text) {
  const out = [];
  for (const sentence of text.split(/[\n\r.;:!?]+|[—–]|--/)) {
    for (const part of sentence.split(/[,()"“”]/)) {
      const c = cleanClause(part);
      if (c) out.push(c);
    }
  }
  return out;
}

/** Dedup key: diacritic-folded, lowercase, alphanumerics only, single-spaced.
 *  Collapses punctuation/case/whitespace/accent variants the old lowercase-exact
 *  key missed, but keeps digits so "Area 51" ≠ "Area". */
export const keyOf = (s) =>
  fold(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');

// ── self-check ──────────────────────────────────────────────────────────────
function demo() {
  const cls = toClauses('In the beginning, God created. Behold! the Sun & the Moon [1].');
  console.assert(cls.includes('In The Beginning'), 'split sentence', cls);
  console.assert(cls.includes('God Created'), 'split on period', cls);
  console.assert(cls.includes('The Sun & The Moon'), 'keep & , drop [1]', cls);
  console.assert(toClauses('Word').length === 0, 'drop single words');
  console.assert(keyOf('Bê Drúnk!') === keyOf('be drunk'), 'fold+punct dedup');
  console.assert(keyOf('Perception, Management') === 'perception management', 'punct key');
  console.assert(keyOf('Area 51') !== keyOf('Area'), 'digits kept in key');
  console.log('lib.mjs self-check passed:', cls);
}
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) demo();
