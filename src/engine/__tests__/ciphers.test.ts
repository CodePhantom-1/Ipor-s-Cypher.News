// @vitest-environment node
import { test, expect } from 'vitest';
import { ciphers } from '../../data/ciphers';

test('ciphers loaded with parallel arrays', () => {
  expect(ciphers.length).toBeGreaterThan(80);
  for (const c of ciphers) expect(c.cArr.length).toBe(c.vArr.length);
});

test('Ordinal maps a-z to 1-26', () => {
  const ord = ciphers.find((c) => c.name === 'Ordinal' && c.category === 'English')!;
  expect(ord).toBeTruthy();
  expect(ord.cArr.slice(0, 3)).toEqual([97, 98, 99]); // a,b,c
  expect(ord.vArr.slice(0, 3)).toEqual([1, 2, 3]);
  expect(ord.vArr[25]).toBe(26); // z
});
