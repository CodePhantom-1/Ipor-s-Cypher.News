import type { Cipher } from './types';
import { calculate } from './calculate';

export interface MatchResult { total: number; count: number; phrases: string[] }
export interface RankOpts { wisdom?: boolean; corpusStart?: number }

/** Precompute every phrase's value under a cipher once, so repeated lookups
 *  (every keystroke) are integer compares instead of full recalculation. */
export function precompute(phrases: string[], cipher: Cipher): Int32Array {
  const v = new Int32Array(phrases.length);
  for (let i = 0; i < phrases.length; i++) v[i] = calculate(phrases[i], cipher).total;
  return v;
}

const STOP = new Set(['the', 'of', 'and', 'to', 'a', 'in', 'is', 'it', 'that', 'for', 'on',
  'with', 'as', 'be', 'by', 'this', 'his', 'her', 'was', 'are', 'or', 'an', 'at', 'i']);
const letters = (s: string) => { let n = 0; for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i) | 32; if (c >= 97 && c <= 122) n++; } return n; };
const wordsOf = (s: string) => s.trim().split(/\s+/).filter(Boolean);
/** name-like: 2–4 words and not dominated by stopwords (a proper-noun heuristic). */
function notable(words: string[]): boolean {
  if (words.length < 2 || words.length > 4) return false;
  const stop = words.filter((w) => STOP.has(w.toLowerCase())).length;
  return stop / words.length < 0.5;
}

export function findMatches(
  phrases: string[], input: string, cipher: Cipher, limit = 300,
  values?: Int32Array, opts: RankOpts = {},
): MatchResult {
  const trimmed = input.trim();
  if (!trimmed) return { total: 0, count: 0, phrases: [] };
  const target = calculate(trimmed, cipher).total;
  const echo = trimmed.toLowerCase();
  const { wisdom = false, corpusStart = Infinity } = opts;
  const inL = letters(trimmed), inW = wordsOf(trimmed).length;

  const idx: number[] = [];
  for (let i = 0; i < phrases.length; i++) {
    // Wisdom Mode partitions the DB: off → original phrases only (index < corpusStart),
    // on → ingest only (index >= corpusStart). With no corpusStart given, match all.
    if (wisdom ? i < corpusStart : i >= corpusStart) continue;
    const val = values ? values[i] : calculate(phrases[i], cipher).total;
    if (val !== target) continue;
    if (phrases[i].toLowerCase() === echo) continue;
    idx.push(i);
  }
  const count = idx.length;

  // Rank, then take the top `limit`. Precedence (each tier breaks ties of the prior):
  //   exact letter-count → word-length proximity → notable/name-like →
  //   letter-count proximity → alphabetical.
  idx.sort((a, b) => {
    const pa = phrases[a], pb = phrases[b];
    const la = letters(pa), lb = letters(pb);
    const ea = la === inL ? 0 : 1, eb = lb === inL ? 0 : 1; if (ea !== eb) return ea - eb;
    const wa = wordsOf(pa), wb = wordsOf(pb);
    const dwa = Math.abs(wa.length - inW), dwb = Math.abs(wb.length - inW); if (dwa !== dwb) return dwa - dwb;
    const na = notable(wa) ? 0 : 1, nb = notable(wb) ? 0 : 1; if (na !== nb) return na - nb;
    const dla = Math.abs(la - inL), dlb = Math.abs(lb - inL); if (dla !== dlb) return dla - dlb;
    return pa < pb ? -1 : pa > pb ? 1 : 0;
  });
  return { total: count, count, phrases: idx.slice(0, limit).map((i) => phrases[i]) };
}
