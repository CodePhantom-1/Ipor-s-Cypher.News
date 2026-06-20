// @vitest-environment node
import { test, expect } from 'vitest';
import { findMatches } from '../match';
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
