# App UI — Design System + Live Calculator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the "Phosphor Decoder" terminal design system and a fast, mobile-first calculator screen that reactively shows every enabled cipher's value for the typed text, using the Plan-1 engine.

**Architecture:** Svelte 5 components consume the pure engine (`src/engine`) + cipher data (`src/data`) through a small reactive store. All visual identity lives in CSS custom properties (`src/styles/tokens.css`) so the 3 palettes are a single `data-palette` swap. No DOM logic in the engine; components are thin.

**Tech Stack:** Svelte 5 (runes), Vite, TypeScript, Vitest + @testing-library/svelte + jsdom, @fontsource (self-hosted fonts).

## Global Constraints

- Static build only; no server runtime. Works on Cloudflare/GitHub Pages.
- `src/engine/` and `src/data/` stay pure — UI imports them, never the reverse.
- Aesthetic = "Phosphor Decoder": dark CRT-instrument; one phosphor **signal** color per palette; tabular numerals as hero; hairline borders w/ corner ticks; restrained scanline + glow; all motion gated behind `@media (prefers-reduced-motion: no-preference)`.
- Fonts: `IBM Plex Mono` (body/numerals, tabular figures) + `Martian Mono` (display/wordmark/values). Self-hosted via `@fontsource` — NO external CDN/font requests.
- Palettes (exactly 3), selected by `:root[data-palette="green|amber|cyan"]`; green is default. Persisted to localStorage key `cyphers.palette`.
- Mobile-first: single-column, large tap targets, input reachable; must be fully usable on a 360px-wide phone (fixes the legacy "desktop only" limitation).
- Numerals everywhere use `font-variant-numeric: tabular-nums`.
- Cipher value color accents derive from each cipher's `hsl` field (from `src/data/ciphers.ts`).
- Default calc options come from the engine's `DEFAULT_OPTS` (Reduced digits) — do not hardcode option values in the UI.

---

## File structure

| File | Responsibility |
|---|---|
| `src/styles/tokens.css` | Design tokens: palettes, color/space/type scales, radii, glow, scanline vars. |
| `src/styles/global.css` | Reset, base element styles, body background/scanline, font-face wiring, motion guards. |
| `src/lib/fonts.ts` | Imports `@fontsource/ibm-plex-mono` + `@fontsource/martian-mono` weights (side-effect import). |
| `src/stores/settings.ts` | `palette` + `enabledCipherIds` stores, localStorage-persisted. |
| `src/stores/calc.svelte.ts` | Reactive `input` + derived `results` (per enabled cipher: id,name,hsl,total) via the engine. |
| `src/lib/Wordmark.svelte` | "CYPHERS" wordmark + blinking cursor block. |
| `src/lib/PaletteSwitch.svelte` | 3-way palette toggle, writes `data-palette` + store. |
| `src/lib/CipherValue.svelte` | One cipher's name + animated tabular value, accent from hsl. |
| `src/lib/CalcInput.svelte` | The phrase input (textarea, mono, signal caret). |
| `src/routes/Calculator.svelte` | Composes input + live cipher grid; mobile-first layout. |
| `src/App.svelte` | Mounts Calculator, applies palette on load, scanline overlay. |
| `src/lib/__tests__/*.test.ts` | Component + store tests. |

---

### Task 1: Design system foundation (tokens, fonts, global styles)

**Files:**
- Create: `src/styles/tokens.css`, `src/styles/global.css`, `src/lib/fonts.ts`
- Modify: `src/main.ts` (import the css + fonts), `src/App.svelte` (apply background + a temporary token swatch so it's visually verifiable)
- Add deps: `@fontsource/ibm-plex-mono`, `@fontsource/martian-mono`

**Interfaces:**
- Produces: CSS custom properties available globally — `--bg`, `--bg-panel`, `--bg-elevated`, `--line`, `--ink`, `--ink-dim`, `--signal`, `--signal-dim`, `--signal-glow`, `--font-mono`, `--font-display`, `--radius`, `--space-1..6`, `--scanline`. Palette swap via `:root[data-palette="..."]`.

- [ ] **Step 1: Install self-hosted fonts**

```bash
npm install @fontsource/ibm-plex-mono @fontsource/martian-mono
```

- [ ] **Step 2: Write the token system**

`src/styles/tokens.css`:
```css
:root {
  /* base surfaces — near-black, faint cool tint */
  --bg: #07090a;
  --bg-panel: #0d1112;
  --bg-elevated: #12181a;
  --line: #1b2426;
  --ink: #c7d2cb;
  --ink-dim: #6c7b73;

  /* signal (overridden per palette) — default green phosphor */
  --signal: #41ffa0;
  --signal-dim: #1f8f5c;
  --signal-glow: rgba(65, 255, 160, 0.35);

  --font-mono: "IBM Plex Mono", ui-monospace, "SFMono-Regular", monospace;
  --font-display: "Martian Mono", var(--font-mono);

  --radius: 2px;
  --space-1: 4px; --space-2: 8px; --space-3: 12px;
  --space-4: 16px; --space-5: 24px; --space-6: 40px;

  --scanline: rgba(255, 255, 255, 0.025);
}
:root[data-palette="amber"] {
  --signal: #ffb454; --signal-dim: #a9701f; --signal-glow: rgba(255, 180, 84, 0.35);
}
:root[data-palette="cyan"] {
  --signal: #34dfe6; --signal-dim: #1c8a8f; --signal-glow: rgba(52, 223, 230, 0.35);
}
```

- [ ] **Step 3: Write global styles (reset, background, scanline, fonts, motion guard)**

`src/styles/global.css`:
```css
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; height: 100%; }
body {
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  -webkit-font-smoothing: antialiased;
  line-height: 1.4;
}
/* subtle CRT scanline overlay, fixed, non-interactive */
body::after {
  content: ""; position: fixed; inset: 0; pointer-events: none; z-index: 9999;
  background: repeating-linear-gradient(
    to bottom, var(--scanline) 0 1px, transparent 1px 3px);
  mix-blend-mode: overlay;
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
.signal { color: var(--signal); text-shadow: 0 0 8px var(--signal-glow); }
.dim { color: var(--ink-dim); }
```

- [ ] **Step 4: Wire fonts + css into the app**

`src/lib/fonts.ts`:
```ts
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/ibm-plex-mono/600.css";
import "@fontsource/martian-mono/600.css";
import "@fontsource/martian-mono/700.css";
```
In `src/main.ts`, add at top (before mounting): `import "./lib/fonts"; import "./styles/tokens.css"; import "./styles/global.css";`

- [ ] **Step 5: Temporary visual proof in `src/App.svelte`**

Replace `src/App.svelte` body with a token swatch: render the wordmark text in `--font-display` signal color, a sample big tabular number, and three buttons setting `document.documentElement.dataset.palette` to green/amber/cyan. (This is scaffolding to eyeball the system; Task 3 replaces it.)

```svelte
<script lang="ts">
  let palette = $state("green");
  $effect(() => { document.documentElement.dataset.palette = palette; });
</script>
<main style="padding: var(--space-6); max-width: 720px; margin: 0 auto;">
  <h1 class="signal" style="font-family: var(--font-display); letter-spacing: .2em;">CYPHERS</h1>
  <p class="dim">phosphor decoder — design tokens</p>
  <div class="signal" style="font-family: var(--font-display); font-size: 4rem;">137</div>
  <div style="display:flex; gap: var(--space-2);">
    {#each ["green","amber","cyan"] as p}
      <button onclick={() => palette = p}
        style="font-family: var(--font-mono); background: var(--bg-elevated); color: var(--ink); border: 1px solid var(--line); border-radius: var(--radius); padding: var(--space-2) var(--space-3);">{p}</button>
    {/each}
  </div>
</main>
```

- [ ] **Step 6: Verify build + dev render**

Run: `npm run build`
Expected: builds clean (fonts bundled, no external requests).
Run: `npm run dev` and confirm (note in report) the page shows the wordmark, the big tabular `137`, and that clicking amber/cyan changes the signal color. (No automated test for pure visual tokens; this is the visual checkpoint.)

- [ ] **Step 7: Commit**

```bash
git add src/styles src/lib/fonts.ts src/main.ts src/App.svelte package.json package-lock.json
git commit -m "feat(ui): Phosphor Decoder design tokens + self-hosted fonts"
```

---

### Task 2: Settings + calc stores

**Files:**
- Create: `src/stores/settings.ts`, `src/stores/calc.svelte.ts`
- Test: `src/lib/__tests__/calc-store.test.ts`

**Interfaces:**
- Consumes: `calculate`, `ciphers`, `Cipher` from engine/data.
- Produces:
  - `settings.ts`: `export const palette = persisted<'green'|'amber'|'cyan'>('cyphers.palette','green')`; `export const enabledCipherIds = persisted<string[]>('cyphers.enabled', DEFAULT_ENABLED)` where `DEFAULT_ENABLED` = ids of ciphers whose data has `enabled === true`.
  - `calc.svelte.ts`: `export function createCalc()` returning `{ get input(), set input(v), get results() }` where `results: { id:string; name:string; hsl:[number,number,number]; total:number }[]` (enabled ciphers only, in data order), recomputed from `input`.
- `persisted` is a tiny localStorage-backed Svelte store helper defined in `settings.ts`.

- [ ] **Step 1: Write the failing store test**

`src/lib/__tests__/calc-store.test.ts`:
```ts
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
```

- [ ] **Step 2: Run — expect FAIL (modules missing)**

Run: `npm test -- calc-store`
Expected: FAIL.

- [ ] **Step 3: Implement the stores**

`src/stores/settings.ts`:
```ts
import { writable, type Writable } from 'svelte/store';
import { ciphers } from '../data/ciphers';

function persisted<T>(key: string, initial: T): Writable<T> {
  let start = initial;
  try { const raw = localStorage.getItem(key); if (raw) start = JSON.parse(raw) as T; } catch {}
  const store = writable<T>(start);
  store.subscribe((v) => { try { localStorage.setItem(key, JSON.stringify(v)); } catch {} });
  return store;
}

export type Palette = 'green' | 'amber' | 'cyan';
export const DEFAULT_ENABLED = ciphers.filter((c) => c.enabled).map((c) => c.id);
export const palette = persisted<Palette>('cyphers.palette', 'green');
export const enabledCipherIds = persisted<string[]>('cyphers.enabled', DEFAULT_ENABLED);
```

`src/stores/calc.svelte.ts`:
```ts
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
```

- [ ] **Step 4: Run — expect PASS**

Run: `npm test -- calc-store`
Expected: 2 passed. (If `$state`/`$derived` need a `.svelte.ts` test context, the file is already `.svelte.ts`; ensure Vitest uses the Svelte plugin — see Task setup note below.)

- [ ] **Step 5: Commit**

```bash
git add src/stores src/lib/__tests__/calc-store.test.ts
git commit -m "feat(ui): persisted settings + reactive calc store"
```

**Setup note (only if Step 4 errors on runes):** ensure `vite.config.ts` test config includes the Svelte plugin and `environment: 'jsdom'` for component/rune tests, and install `jsdom @testing-library/svelte`. Add `jsdom` to the test env (`test: { environment: 'jsdom', ... }`) — engine tests stay node-fast via a per-file `// @vitest-environment node` pragma if needed.

---

### Task 3: Calculator screen (input → live cipher grid)

**Files:**
- Create: `src/lib/Wordmark.svelte`, `src/lib/PaletteSwitch.svelte`, `src/lib/CalcInput.svelte`, `src/lib/CipherValue.svelte`, `src/routes/Calculator.svelte`
- Modify: `src/App.svelte` (mount Calculator, apply palette on load)
- Test: `src/lib/__tests__/calculator.test.ts`

**Interfaces:**
- Consumes: `createCalc` (Task 2), `palette` store (Task 2), tokens (Task 1).
- `CipherValue.svelte` props: `{ name: string; total: number; hsl: [number,number,number] }`.
- `PaletteSwitch.svelte`: writes `palette` store + `document.documentElement.dataset.palette`.

- [ ] **Step 1: Write the failing component test**

`src/lib/__tests__/calculator.test.ts`:
```ts
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
```

- [ ] **Step 2: Run — expect FAIL**

Run: `npm test -- calculator`
Expected: FAIL (Calculator not found).

- [ ] **Step 3: Implement the components**

`src/lib/CipherValue.svelte`:
```svelte
<script lang="ts">
  let { name, total, hsl }: { name: string; total: number; hsl: [number, number, number] } = $props();
  const accent = $derived(`hsl(${hsl[0]} ${hsl[1]}% ${hsl[2]}%)`);
</script>
<div class="row">
  <span class="name dim">{name}</span>
  <span class="val" data-testid={`cipher-value-${name}`} style={`--accent:${accent}`}>{total}</span>
</div>
<style>
  .row { display:flex; align-items:baseline; justify-content:space-between; gap: var(--space-3);
    padding: var(--space-2) 0; border-bottom: 1px solid var(--line); }
  .name { font-size: .8rem; letter-spacing: .04em; text-transform: uppercase; }
  .val { font-family: var(--font-display); font-size: 1.6rem; color: var(--accent);
    text-shadow: 0 0 8px color-mix(in srgb, var(--accent) 35%, transparent); }
  @media (prefers-reduced-motion: no-preference) {
    .val { animation: flick .18s ease-out; }
  }
  @keyframes flick { from { opacity:.4; transform: translateY(-1px); } to { opacity:1; transform:none; } }
</style>
```
Note: the test queries `cipher-value-${id}`; set `data-testid={`cipher-value-${id}`}` — pass `id` as a prop too. Update props to `{ id, name, total, hsl }` and use `id` in the testid.

`src/lib/CalcInput.svelte`:
```svelte
<script lang="ts">
  let { value = $bindable('') }: { value?: string } = $props();
</script>
<textarea class="input" bind:value rows="2" spellcheck="false" autocomplete="off"
  placeholder="type a word or phrase…" aria-label="phrase to decode"></textarea>
<style>
  .input { width:100%; resize:vertical; background: var(--bg-panel); color: var(--ink);
    border: 1px solid var(--line); border-radius: var(--radius);
    font-family: var(--font-mono); font-size: 1.1rem; padding: var(--space-4);
    caret-color: var(--signal); }
  .input:focus { outline: none; border-color: var(--signal-dim);
    box-shadow: 0 0 0 1px var(--signal-dim), 0 0 16px var(--signal-glow); }
</style>
```

`src/lib/Wordmark.svelte`:
```svelte
<div class="wm signal" style="font-family:var(--font-display); letter-spacing:.24em;">
  CYPHERS<span class="cur">▋</span>
</div>
<style>
  .wm { font-weight:700; }
  @media (prefers-reduced-motion: no-preference) { .cur { animation: blink 1.1s steps(1) infinite; } }
  @keyframes blink { 50% { opacity: 0; } }
</style>
```

`src/lib/PaletteSwitch.svelte`:
```svelte
<script lang="ts">
  import { palette, type Palette } from '../stores/settings';
  const opts: Palette[] = ['green','amber','cyan'];
  function set(p: Palette) { palette.set(p); document.documentElement.dataset.palette = p; }
</script>
<div class="ps">
  {#each opts as p}
    <button class:active={$palette === p} onclick={() => set(p)} aria-label={`${p} palette`}>{p}</button>
  {/each}
</div>
<style>
  .ps { display:flex; gap: var(--space-1); }
  button { font-family:var(--font-mono); font-size:.7rem; text-transform:uppercase; letter-spacing:.08em;
    background:transparent; color:var(--ink-dim); border:1px solid var(--line); border-radius:var(--radius);
    padding: 2px 8px; cursor:pointer; }
  button.active { color: var(--signal); border-color: var(--signal-dim); }
</style>
```

`src/routes/Calculator.svelte`:
```svelte
<script lang="ts">
  import { createCalc } from '../stores/calc.svelte';
  import CalcInput from '../lib/CalcInput.svelte';
  import CipherValue from '../lib/CipherValue.svelte';
  import Wordmark from '../lib/Wordmark.svelte';
  import PaletteSwitch from '../lib/PaletteSwitch.svelte';
  const calc = createCalc();
  let value = $state('');
  $effect(() => { calc.input = value; });
</script>
<div class="shell">
  <header><Wordmark /><PaletteSwitch /></header>
  <CalcInput bind:value />
  <section class="grid" aria-live="polite">
    {#each calc.results as r (r.id)}
      <CipherValue id={r.id} name={r.name} total={r.total} hsl={r.hsl} />
    {/each}
  </section>
</div>
<style>
  .shell { max-width: 680px; margin: 0 auto; padding: var(--space-5) var(--space-4) var(--space-6);
    display:flex; flex-direction:column; gap: var(--space-4); }
  header { display:flex; align-items:center; justify-content:space-between; }
  .grid { display:flex; flex-direction:column; }
  @media (min-width: 720px) { .grid { display:grid; grid-template-columns: 1fr 1fr; column-gap: var(--space-5); } }
</style>
```
(Update `CipherValue.svelte` props to include `id` and use it in `data-testid` per the test.)

`src/App.svelte`:
```svelte
<script lang="ts">
  import Calculator from './routes/Calculator.svelte';
  import { palette } from './stores/settings';
  import { get } from 'svelte/store';
  if (typeof document !== 'undefined') document.documentElement.dataset.palette = get(palette);
</script>
<Calculator />
```

- [ ] **Step 4: Run — expect PASS**

Run: `npm test -- calculator`
Expected: passes (value cell shows the engine's total).

- [ ] **Step 5: Full suite + build**

Run: `npm test` (all green) and `npm run build` (clean).

- [ ] **Step 6: Commit**

```bash
git add src/lib src/routes src/App.svelte
git commit -m "feat(ui): live terminal calculator (input -> reactive cipher grid)"
```

---

## Self-Review

- **Spec coverage:** spec §4/§5 (terminal aesthetic, mobile-first, 3 palettes, live cipher values) → Tasks 1-3. DB matching, breakdown, custom ciphers, history/export, share, AI → later plans (out of scope here, stated).
- **Placeholder scan:** tokens, stores, and components have complete code; the two cross-references (CipherValue gains an `id` prop for the testid; Vitest jsdom/svelte setup note) are called out explicitly with the exact change.
- **Type consistency:** `CalcResult { id,name,hsl,total }` produced by `createCalc` (Task 2) and consumed by `Calculator`/`CipherValue` (Task 3); `Palette` type shared from `settings.ts`.
- **Known setup risk:** Svelte rune tests (`.svelte.ts` + components) need the Svelte Vitest plugin + jsdom; Task 2's setup note + Task 1 deps cover it. If `@testing-library/svelte`/`jsdom` aren't present, the implementer installs them as part of Task 2/3.
- **CipherValue testid:** the component must accept an `id` prop and render `data-testid={`cipher-value-${id}`}` (Task 3 test queries by id, not name) — the prose under Step 3 says so; ensure the final component matches.
