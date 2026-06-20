// @vitest-environment node
import { test, expect } from 'vitest';
import { findMatches, precompute } from '../match';
import { calculate } from '../calculate';
import { ciphers } from '../../data/ciphers';

const ordinal = () => ciphers.find((c) => c.name === 'Ordinal' && c.category === 'English')!;

test('finds phrases sharing the input value, excludes echo, counts all, caps list', () => {
  const c = ordinal();
  const target = calculate('hello', c).total;
  const phrases = ['hello', 'HELLO', 'world', 'zzz', ...Array.from({ length: 500 }, (_, i) => `pad${i}`)];
  // build a known set: include some real matches
  const matches = phrases.filter((p) => calculate(p, c).total === target && p.toLowerCase() !== 'hello');
  const res = findMatches(phrases, 'hello', c, 300);
  expect(res.total).toBe(matches.length);
  expect(res.phrases.length).toBe(Math.min(matches.length, 300));
  expect(res.phrases).not.toContain('hello');
  expect(res.phrases).not.toContain('HELLO'); // case-insensitive echo excluded
  for (const p of res.phrases) expect(calculate(p, c).total).toBe(target);
});

test('empty input yields no matches', () => {
  expect(findMatches(['a','b'], '', ordinal()).total).toBe(0);
});

test('precomputed values give identical results to recomputing', () => {
  const c = ordinal();
  const phrases = ['hello', 'HELLO', 'world', 'zzz', ...Array.from({ length: 200 }, (_, i) => `pad${i}`)];
  const values = precompute(phrases, c);
  const a = findMatches(phrases, 'hello', c, 300);
  const b = findMatches(phrases, 'hello', c, 300, values);
  expect(b).toEqual(a);
});

test('ranking: exact letter-count first; Wisdom Mode shows ONLY ingest phrases', () => {
  const c = ordinal();
  // 'ab' (a+b=3) and 'c' (3) both match input 'ba' (3); 'ba' isn't an echo of either
  const phrases = ['ab', 'c'];
  // default: both match, 'ab' wins — its letter count (2) equals the input's, 'c' (1) doesn't
  expect(findMatches(phrases, 'ba', c).total).toBe(2);
  expect(findMatches(phrases, 'ba', c).phrases[0]).toBe('ab');
  // Wisdom Mode: corpusStart 1 → only index >= 1 ('c') is eligible; 'ab' is excluded entirely
  const wis = findMatches(phrases, 'ba', c, 300, undefined, { wisdom: true, corpusStart: 1 });
  expect(wis.phrases).toEqual(['c']);
  expect(wis.total).toBe(1);
});
