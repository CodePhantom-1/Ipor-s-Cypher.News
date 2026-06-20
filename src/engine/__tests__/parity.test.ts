// @vitest-environment node
/// <reference types="node" />
import { test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { calculate } from '../calculate';
import { ciphers } from '../../data/ciphers';
import { legacyCalc } from '../../../scripts/legacy-ref.mjs';

// Build a corpus from the real word DB + edge cases.
const raw = readFileSync('legacy/db.txt', 'utf8');
const words = raw.split(/\s+/).filter(Boolean).slice(0, 4000);
const corpus = [...new Set([...words, 'café', 'HELLO', 'a b c', 'naïve', 'Œuvre', 'résumé', ''])];

test('new engine matches legacy for every cipher across the corpus', () => {
  // M3 non-vacuous guards: prove this gate actually exercises a real cipher set and a
  // real corpus, not an empty/trivial one.
  expect(ciphers.length).toBeGreaterThan(80);
  expect(corpus.length).toBeGreaterThan(1000);
  // Prove the digit path (legacy Reduced-digit default, calc.js:44) is actually exercised —
  // db.txt's first 4000 tokens contain digit-bearing words like "11:11".
  expect(corpus.some((w) => /[0-9]/.test(w))).toBe(true);

  const mismatches: string[] = [];
  for (const c of ciphers) {
    for (const w of corpus) {
      const a = calculate(w, c).total;
      const b = legacyCalc(w, { cArr: c.cArr, vArr: c.vArr, diacriticsAsRegular: c.diacriticsAsRegular, caseSensitive: c.caseSensitive });
      if (a !== b) { mismatches.push(`${c.category}/${c.name} "${w}": new=${a} legacy=${b}`); if (mismatches.length > 20) break; }
    }
    if (mismatches.length > 20) break;
  }
  expect(mismatches, mismatches.slice(0, 20).join('\n')).toHaveLength(0);
});
