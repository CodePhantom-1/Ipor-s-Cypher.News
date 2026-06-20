import { test, expect, beforeEach } from 'vitest';
import { createCalc } from '../../stores/calc.svelte';
import { enabledCipherIds } from '../../stores/settings';
import { get } from 'svelte/store';
import { ciphers } from '../../data/ciphers';
import { calculate } from '../../engine/calculate';

beforeEach(() => localStorage.clear());

test('default enabled set is non-empty and matches data', () => {
  const ids = get(enabledCipherIds);
  expect(ids.length).toBeGreaterThan(0);
  const dataEnabled = ciphers.filter((c) => c.enabled).map((c) => c.id);
  expect(ids).toEqual(dataEnabled);
});

test('results recompute from input for enabled ciphers', () => {
  const calc = createCalc();
  calc.input = 'hello';
  const ids = get(enabledCipherIds);
  expect(calc.results.map((r) => r.id)).toEqual(ids);
  for (const r of calc.results) {
    const c = ciphers.find((x) => x.id === r.id)!;
    expect(r.total).toBe(calculate('hello', c).total);
  }
});
