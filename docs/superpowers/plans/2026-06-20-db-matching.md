# DB Phrase Matching Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When you type a phrase, instantly list other phrases from the ~97k-entry database that share its gematria value for a chosen cipher — computed off the main thread so the UI never janks.

**Architecture:** A build-time script turns `legacy/db.txt` into a clean static asset (`public/cyphers-db.txt`). A pure `findMatches()` function (engine-based, fully tested) does the matching; a Web Worker wraps it so the 97k-phrase scan runs off the main thread. A debounced store feeds the worker and a terminal-styled Matches panel renders results under the calculator.

**Tech Stack:** Svelte 5 + Vite (worker via `?worker` import), TypeScript, Vitest.

## Global Constraints

- Static build only; the DB ships as a static asset fetched at runtime (NOT bundled into JS).
- `src/engine/` and `src/data/` stay pure and untouched; the worker imports the engine, never the reverse.
- Matching must use the engine `calculate()` at its defaults (Reduced digits) — identical scoring to the calculator grid.
- Heavy work (97k-phrase scan) runs ONLY in the Web Worker; the main thread debounces input (~150ms) and renders.
- Aesthetic = Phosphor Decoder (reuse existing tokens/components; match count uses signal color + tabular numerals).
- Cap rendered matches per query (e.g. 300) for DOM perf; show the true total count.
- DB transform is reproducible and idempotent; the generated `public/cyphers-db.txt` is committed.

---

## File structure

| File | Responsibility |
|---|---|
| `scripts/build-db.mjs` | One-shot: `legacy/db.txt` → `public/cyphers-db.txt` (strip header, trim, dedupe, drop empties). |
| `public/cyphers-db.txt` | Generated static phrase list (one phrase/line), served + fetched at runtime. |
| `src/lib/db.ts` | `loadPhrases(): Promise<string[]>` — fetch + cache the asset. |
| `src/engine/match.ts` | Pure `findMatches(phrases, input, cipher, limit?) → { total: number; phrases: string[] }`. |
| `src/worker/match.worker.ts` | Web Worker: loads phrases once, runs `findMatches` per request, posts results. |
| `src/stores/matches.svelte.ts` | Debounced bridge: input + match-cipher id → worker → reactive `{ loading, total, phrases }`. |
| `src/lib/Matches.svelte` | Terminal-styled panel: cipher selector + count + phrase list. |
| `src/routes/Calculator.svelte` | Mount `<Matches>` under the cipher grid (small edit). |
| `src/engine/__tests__/match.test.ts`, `src/lib/__tests__/matches-ui.test.ts` | Tests. |

---

### Task 1: Build-time DB transform + loader

**Files:**
- Create: `scripts/build-db.mjs`, `src/lib/db.ts`
- Generate: `public/cyphers-db.txt`
- Test: `src/lib/__tests__/db.test.ts`

**Interfaces:**
- Produces: `export async function loadPhrases(): Promise<string[]>` (fetches `/cyphers-db.txt`, splits lines, caches the promise).

- [ ] **Step 1: Write the transform script**

`scripts/build-db.mjs`:
```js
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const raw = readFileSync('legacy/db.txt', 'utf8');
const seen = new Set();
const out = [];
for (const line of raw.split(/\r?\n/)) {
  const phrase = line.trim();
  if (!phrase) continue;
  if (phrase === 'CREATE_GEMATRO_DB') continue; // header sentinel
  const key = phrase.toLowerCase();
  if (seen.has(key)) continue; // legacy dedupes case-insensitively
  seen.add(key);
  out.push(phrase);
}
mkdirSync('public', { recursive: true });
writeFileSync('public/cyphers-db.txt', out.join('\n') + '\n');
console.log(`Wrote ${out.length} phrases to public/cyphers-db.txt`);
```

- [ ] **Step 2: Run it**

Run: `node scripts/build-db.mjs`
Expected: `Wrote <N> phrases to public/cyphers-db.txt` where N is large (tens of thousands; the source has 97189 lines, fewer after dedupe/empties). Note the exact N in the report.

- [ ] **Step 3: Write the loader**

`src/lib/db.ts`:
```ts
let cache: Promise<string[]> | null = null;
export function loadPhrases(): Promise<string[]> {
  if (cache) return cache;
  cache = fetch('/cyphers-db.txt')
    .then((r) => { if (!r.ok) throw new Error(`db fetch ${r.status}`); return r.text(); })
    .then((t) => t.split('\n').map((l) => l.trim()).filter(Boolean));
  return cache;
}
```

- [ ] **Step 4: Write the test**

`src/lib/__tests__/db.test.ts`:
```ts
import { test, expect } from 'vitest';
import { readFileSync } from 'node:fs';

test('generated db is clean: no header, no blanks, deduped', () => {
  const lines = readFileSync('public/cyphers-db.txt', 'utf8').split('\n').filter(Boolean);
  expect(lines.length).toBeGreaterThan(1000);
  expect(lines).not.toContain('CREATE_GEMATRO_DB');
  expect(lines.every((l) => l === l.trim())).toBe(true);
  const lower = lines.map((l) => l.toLowerCase());
  expect(new Set(lower).size).toBe(lower.length); // no case-insensitive dupes
});
```

- [ ] **Step 5: Run — expect PASS**

Run: `npm test -- db.test`
Expected: 1 passed.

- [ ] **Step 6: Commit**

```bash
git add scripts/build-db.mjs public/cyphers-db.txt src/lib/db.ts src/lib/__tests__/db.test.ts
git commit -m "feat(db): build-time db.txt transform + phrase loader"
```

---

### Task 2: Pure matching function

**Files:**
- Create: `src/engine/match.ts`
- Test: `src/engine/__tests__/match.test.ts`

**Interfaces:**
- Consumes: `calculate` + `Cipher` from the engine.
- Produces: `export interface MatchResult { total: number; count: number; phrases: string[] }` and `export function findMatches(phrases: string[], input: string, cipher: Cipher, limit = 300): MatchResult` — computes `input`'s total for `cipher`, returns phrases whose total equals it (excluding an exact case-insensitive echo of the input), `count` = true number of matches, `phrases` = first `limit`.

- [ ] **Step 1: Write the failing test**

`src/engine/__tests__/match.test.ts` (`// @vitest-environment node` at top):
```ts
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
```

- [ ] **Step 2: Run — expect FAIL**

Run: `npm test -- match.test`
Expected: FAIL (findMatches not defined).

- [ ] **Step 3: Implement**

`src/engine/match.ts`:
```ts
import type { Cipher } from './types';
import { calculate } from './calculate';

export interface MatchResult { total: number; count: number; phrases: string[] }

export function findMatches(phrases: string[], input: string, cipher: Cipher, limit = 300): MatchResult {
  const trimmed = input.trim();
  if (!trimmed) return { total: 0, count: 0, phrases: [] };
  const target = calculate(trimmed, cipher).total;
  const echo = trimmed.toLowerCase();
  const out: string[] = [];
  let count = 0;
  for (const p of phrases) {
    if (calculate(p, cipher).total !== target) continue;
    if (p.toLowerCase() === echo) continue;
    count++;
    if (out.length < limit) out.push(p);
  }
  return { total: count, count, phrases: out };
}
```

- [ ] **Step 4: Run — expect PASS**

Run: `npm test -- match.test`
Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add src/engine/match.ts src/engine/__tests__/match.test.ts
git commit -m "feat(engine): pure findMatches() over the phrase DB"
```

---

### Task 3: Web Worker + debounced store + Matches panel

**Files:**
- Create: `src/worker/match.worker.ts`, `src/stores/matches.svelte.ts`, `src/lib/Matches.svelte`
- Modify: `src/routes/Calculator.svelte` (mount `<Matches>`)
- Test: `src/lib/__tests__/matches-ui.test.ts`

**Interfaces:**
- Consumes: `findMatches`, `loadPhrases`, `ciphers`, `enabledCipherIds`.
- Worker protocol: post `{ reqId: number; input: string; cipherId: string }`; worker replies `{ reqId; total: number; phrases: string[] }`. Worker lazy-loads phrases via fetch on first message (it runs in the page origin, so `fetch('/cyphers-db.txt')` works).
- `matches.svelte.ts`: `createMatches()` → `{ set input(v), set cipherId(v), get loading(), get total(), get phrases() }`, debounced 150ms, ignores stale `reqId` replies.

- [ ] **Step 1: Write the failing UI test**

`src/lib/__tests__/matches-ui.test.ts`:
```ts
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
```

- [ ] **Step 2: Run — expect FAIL**

Run: `npm test -- matches-ui`
Expected: FAIL (Matches.svelte missing).

- [ ] **Step 3: Implement worker + store + panel**

`src/worker/match.worker.ts`:
```ts
import { findMatches } from '../engine/match';
import { ciphers } from '../data/ciphers';

const byId = new Map(ciphers.map((c) => [c.id, c]));
let phrases: string[] | null = null;
async function ensure(): Promise<string[]> {
  if (phrases) return phrases;
  const r = await fetch('/cyphers-db.txt');
  phrases = (await r.text()).split('\n').map((l) => l.trim()).filter(Boolean);
  return phrases;
}
self.onmessage = async (e: MessageEvent) => {
  const { reqId, input, cipherId } = e.data as { reqId: number; input: string; cipherId: string };
  const cipher = byId.get(cipherId);
  if (!cipher) { (self as any).postMessage({ reqId, total: 0, phrases: [] }); return; }
  const list = await ensure();
  const res = findMatches(list, input, cipher, 300);
  (self as any).postMessage({ reqId, total: res.total, phrases: res.phrases });
};
```

`src/stores/matches.svelte.ts`:
```ts
import MatchWorker from '../worker/match.worker?worker';

export function createMatches() {
  let loading = $state(false);
  let total = $state(0);
  let phrases = $state<string[]>([]);
  let input = ''; let cipherId = '';
  let reqId = 0; let lastSent = 0; let timer: ReturnType<typeof setTimeout> | null = null;
  const worker = new MatchWorker();
  worker.onmessage = (e: MessageEvent) => {
    const d = e.data as { reqId: number; total: number; phrases: string[] };
    if (d.reqId !== lastSent) return; // ignore stale
    total = d.total; phrases = d.phrases; loading = false;
  };
  function schedule() {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      if (!input.trim()) { total = 0; phrases = []; loading = false; return; }
      loading = true; lastSent = ++reqId;
      worker.postMessage({ reqId: lastSent, input, cipherId });
    }, 150);
  }
  return {
    set input(v: string) { input = v; schedule(); },
    set cipherId(v: string) { cipherId = v; schedule(); },
    get loading() { return loading; },
    get total() { return total; },
    get phrases() { return phrases; },
  };
}
```

`src/lib/Matches.svelte`:
```svelte
<script lang="ts">
  import { createMatches } from '../stores/matches.svelte';
  import { enabledCipherIds } from '../stores/settings';
  import { ciphers } from '../data/ciphers';
  import { get } from 'svelte/store';
  let { input = '' }: { input?: string } = $props();
  const enabled = $derived(get(enabledCipherIds));
  let cipherId = $state(get(enabledCipherIds)[0] ?? '');
  const m = createMatches();
  $effect(() => { m.cipherId = cipherId; });
  $effect(() => { m.input = input; });
  const names = new Map(ciphers.map((c) => [c.id, c.name]));
</script>
<section class="matches">
  <header>
    <span class="dim">MATCHES</span>
    <select bind:value={cipherId} aria-label="match cipher">
      {#each enabled as id}<option value={id}>{names.get(id)}</option>{/each}
    </select>
    <span class="count signal" data-testid="match-count">{m.total}</span>
  </header>
  {#if m.loading}<p class="dim">scanning…</p>{/if}
  <ul>
    {#each m.phrases as p}<li>{p}</li>{/each}
  </ul>
</section>
<style>
  .matches { margin-top: var(--space-5); border-top: 1px solid var(--line); padding-top: var(--space-3); }
  header { display:flex; align-items:center; gap: var(--space-3); }
  .count { font-family: var(--font-display); margin-left:auto; }
  select { background: var(--bg-elevated); color: var(--ink); border:1px solid var(--line);
    border-radius: var(--radius); font-family: var(--font-mono); font-size:.8rem; padding:2px 6px; }
  ul { list-style:none; margin: var(--space-3) 0 0; padding:0; display:flex; flex-direction:column; gap:2px;
    max-height: 50vh; overflow:auto; }
  li { font-size:.95rem; padding: 2px 0; border-bottom:1px solid var(--line); }
</style>
```

In `src/routes/Calculator.svelte`: import `Matches` and render `<Matches input={value} />` right after the `.grid` section.

- [ ] **Step 4: Run — expect PASS**

Run: `npm test -- matches-ui`
Expected: passes (the mock drives `findMatches`; "olleh" shows, count is numeric).

- [ ] **Step 5: Full suite + build**

Run: `npm test` (all green) and `npm run build` (clean; the worker is emitted as its own chunk, db stays a fetched asset). Confirm no engine/data source changes.

- [ ] **Step 6: Commit**

```bash
git add src/worker src/stores/matches.svelte.ts src/lib/Matches.svelte src/routes/Calculator.svelte src/lib/__tests__/matches-ui.test.ts
git commit -m "feat(ui): worker-backed live phrase matching panel"
```

---

## Self-Review

- **Spec coverage:** spec §3 (DB → instant phrase matching, Web Worker so UI stays snappy) → Tasks 1-3. Reverse value→phrases index + full-text/cross-cipher power search → Plan 4 (out of scope here, stated). Build-time transform + static asset (not bundled) satisfied in Task 1.
- **Placeholder scan:** transform, loader, `findMatches`, worker, store, and panel all have complete code; the UI test mocks the worker (jsdom has no module worker) and drives the real `findMatches`, so it tests genuine matching behavior, not a stub.
- **Type consistency:** `MatchResult { total, count, phrases }` from `findMatches` (Task 2) used by the worker (Task 3); worker protocol `{ reqId, input, cipherId }` ⇄ `{ reqId, total, phrases }` consistent across worker + store.
- **Perf integrity:** the 97k scan runs only in the worker; main thread debounces 150ms and drops stale `reqId` replies; rendered list capped at 300 while `total` shows the real count.
- **Known risk:** real module workers don't run in jsdom — the UI test deliberately mocks the store; the worker's own glue is thin and exercised via the build + a manual check. Engine parity of matching is covered by the pure `match.test.ts` (node env).
