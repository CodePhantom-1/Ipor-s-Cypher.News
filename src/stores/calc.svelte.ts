import { get } from 'svelte/store';
import { ciphers } from '../data/ciphers';
import { calculate } from '../engine/calculate';
import { enabledCipherIds } from './settings';

export interface CalcResult { id: string; name: string; hsl: [number, number, number]; total: number }

export function createCalc() {
  let input = $state('');
  let enabled = $state(get(enabledCipherIds));
  enabledCipherIds.subscribe((v) => { enabled = v; });
  const byId = new Map(ciphers.map((c) => [c.id, c]));
  const results = $derived(
    enabled
      .map((id) => byId.get(id))
      .filter((c): c is NonNullable<typeof c> => !!c)
      .map((c) => ({ id: c.id, name: c.name, hsl: c.hsl, total: calculate(input, c).total }))
  );
  return {
    get input() { return input; },
    set input(v: string) { input = v; },
    get results() { return results; },
  };
}
