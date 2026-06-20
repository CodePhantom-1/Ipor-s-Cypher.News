import { test, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, screen, waitFor } from '@testing-library/svelte';

// Mock the worker module: drive matching synchronously via the pure fn so the
// component is tested without a real Worker (jsdom has no module workers).
vi.mock('../../stores/matches.svelte', async () => {
  const { findMatches } = await import('../../engine/match');
  const { ciphers } = await import('../../data/ciphers');
  return {
    createMatches() {
      let input = ''; let cipherId = ciphers.find((c:any)=>c.enabled)!.id;
      const phrases = ['hello','olleh','world'];
      let res = { total: 0, phrases: [] as string[] };
      const recompute = () => { const c = ciphers.find((x:any)=>x.id===cipherId)!; res = (() => { const r = findMatches(phrases, input, c); return { total: r.total, phrases: r.phrases }; })(); };
      return { set input(v:string){ input=v; recompute(); }, set cipherId(v:string){ cipherId=v; recompute(); }, get loading(){return false;}, get total(){return res.total;}, get phrases(){return res.phrases;} };
    },
  };
});

import Matches from '../Matches.svelte';
beforeEach(() => localStorage.clear());

test('shows count + matching phrases for the typed input', async () => {
  render(Matches, { props: { input: 'hello' } });
  await waitFor(() => expect(screen.getByTestId('match-count').textContent).toMatch(/\d/));
  // 'olleh' shares Ordinal value with 'hello'; 'world' does not
  expect(screen.getByText('olleh')).toBeTruthy();
});
