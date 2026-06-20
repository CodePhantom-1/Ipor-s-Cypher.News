import { test, expect, beforeEach } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/svelte';
import Calculator from '../../routes/Calculator.svelte';
import { ciphers } from '../../data/ciphers';
import { calculate } from '../../engine/calculate';

beforeEach(() => localStorage.clear());

test('typing a phrase shows the correct value for the first enabled cipher', async () => {
  render(Calculator);
  const input = screen.getByRole('textbox');
  await fireEvent.input(input, { target: { value: 'hello' } });
  const firstEnabled = ciphers.find((c) => c.enabled)!;
  const expected = String(calculate('hello', firstEnabled).total);
  // the cipher's value cell is labelled by its name
  const cell = await screen.findByTestId(`cipher-value-${firstEnabled.id}`);
  expect(cell.textContent).toContain(expected);
});
