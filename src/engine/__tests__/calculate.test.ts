import { test, expect } from 'vitest';
import { calculate } from '../calculate';
import { ciphers } from '../../data/ciphers';

const ordinal = () => ciphers.find((c) => c.name === 'Ordinal' && c.category === 'English')!;
const reduction = () => ciphers.find((c) => c.name === 'Reduction' && c.category === 'English')!;

// NOTE: brief stated hello=45/18 for Ordinal/Reduction; verified against legacy/calc/ciphers.js
// (a=1..z=26 for Ordinal, 1-9 repeating for Reduction) the correct values are 52/25. See
// task-3-report.md "Concerns" for the verification trail.
test('Ordinal hello = 52', () => { expect(calculate('hello', ordinal()).total).toBe(52); });
test('Reduction hello = 25', () => { expect(calculate('hello', reduction()).total).toBe(25); });
test('spaces ignored', () => {
  expect(calculate('hello world', ordinal()).total)
    .toBe(calculate('helloworld', ordinal()).total);
});
test('punctuation ignored', () => { expect(calculate('a!b', ordinal()).total).toBe(3); });
test('case-insensitive by default', () => {
  expect(calculate('ABC', ordinal()).total).toBe(calculate('abc', ordinal()).total);
});
test('diacritics folded when diacriticsAsRegular', () => {
  expect(calculate('café', ordinal()).total).toBe(calculate('cafe', ordinal()).total);
});
test('digits ignored by default (numCalcMethod 0)', () => {
  expect(calculate('a1b', ordinal()).total).toBe(3);
});
test('digits full: consecutive digits as one number', () => {
  expect(calculate('12', ordinal(), { numCalcMethod: 1 }).total).toBe(12);
});
test('digits reduced: each digit added', () => {
  expect(calculate('12', ordinal(), { numCalcMethod: 2 }).total).toBe(3);
});
test('phrase comments stripped when enabled', () => {
  expect(calculate('[note]test', ordinal(), { allowPhraseComments: true }).total)
    .toBe(calculate('test', ordinal()).total);
});
test('perChar breakdown matches', () => {
  const r = calculate('ab', ordinal());
  expect(r.perChar).toEqual([{ char: 'a', value: 1 }, { char: 'b', value: 2 }]);
});
