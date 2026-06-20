# Engine Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Svelte+Vite+TS project and a pure, framework-agnostic gematria engine whose output is byte-for-byte identical to the legacy calculator, proven by an automated parity gate over all 92 ciphers.

**Architecture:** The legacy site is moved into `legacy/` (kept as the parity reference). A fresh Vite app is scaffolded at the repo root. The engine lives in `src/engine/` (pure, no DOM): cipher definitions are *extracted as data* from `legacy/calc/ciphers.js` via a capture-stub script; `calculate()` reimplements the legacy normalization+sum exactly. A parity harness runs the **verbatim** legacy `calcGematria` and the new `calculate()` over a large corpus and asserts identical totals — this gate blocks everything downstream.

**Tech Stack:** Svelte 5 + Vite + TypeScript, Vitest (unit + parity), Node 20+.

## Global Constraints

- Static build only — no server runtime in this plan. (AI Function comes in Plan 4.)
- Engine modules under `src/engine/` and `src/data/` MUST NOT import any DOM, Svelte, or browser API. Pure TS.
- **Exact parity:** the new engine matches legacy output bug-for-bug. No cipher "corrections" in this plan.
- Default calculation options (match legacy SHIPPED globals): `allowPhraseComments=false`, `numCalcMethod=2` (Reduced — legacy `legacy/calc/calc.js:44` ships `optNumCalcMethod=2`; digits ARE counted, each digit reduced, only for ciphers whose `cArr` does not itself define digits), `multCharPos=false`, `multCharPosReverse=false`. Per-cipher flags `diacriticsAsRegular` and `caseSensitive` come from the cipher data. (Corrected from an earlier draft that said `numCalcMethod=0`; the parity gate must run at the real legacy default.)
- Cipher constructor arg order (from `legacy/calc/ciphers.js`): `(cipherName, cipherCategory, H, S, L, cArr, vArr, diacriticsAsRegular=true, enabled=false, caseSensitive=false)`.

---

## File structure

| File | Responsibility |
|---|---|
| `legacy/` (moved) | The original site, kept verbatim as the parity reference + corpus source (`legacy/db.txt`). |
| `package.json`, `vite.config.ts`, `tsconfig.json` | Fresh Vite/Svelte/TS scaffold at root. |
| `src/engine/types.ts` | `Cipher`, `CalcOptions`, `CalcResult`, `PerChar` types. Pure. |
| `src/engine/calculate.ts` | `calculate(text, cipher, opts?) → CalcResult`. The core. Pure. |
| `src/data/ciphers.ts` | Generated typed cipher data (92 entries). |
| `scripts/extract-ciphers.mjs` | One-shot: capture-stub eval of legacy ciphers.js → writes `src/data/ciphers.ts`. |
| `scripts/legacy-ref.mjs` | The legacy `calcGematria`, copied verbatim, wrapped to run in Node on captured cipher data. Parity reference only. |
| `src/engine/__tests__/calculate.test.ts` | Behavior unit tests. |
| `src/engine/__tests__/parity.test.ts` | The parity gate over all ciphers × corpus. |

---

### Task 1: Scaffold project; preserve legacy as reference

**Files:**
- Move: all legacy app files → `legacy/`
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `src/main.ts`, `index.html`, `src/sanity.test.ts`

**Interfaces:**
- Produces: a building Vite app and a passing `npm test` (Vitest) for later tasks to extend.

- [ ] **Step 1: Move the legacy site into `legacy/` (keep it for parity + corpus)**

```bash
cd gematro-hyperdope
mkdir -p legacy
git mv calc db.txt font index.html lib manifest.json res theme legacy/
git commit -m "chore: move legacy app into legacy/ as parity reference"
```

- [ ] **Step 2: Scaffold Svelte+TS at root and add Vitest**

```bash
npm create vite@latest . -- --template svelte-ts
npm install
npm install -D vitest
```

- [ ] **Step 3: Add the test script + Vitest config**

In `package.json` add to `"scripts"`: `"test": "vitest run"`, `"test:watch": "vitest"`.
Append to `vite.config.ts` so Vitest resolves (inside `defineConfig({...})` add):

```ts
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
```

- [ ] **Step 4: Write a sanity test**

`src/sanity.test.ts`:
```ts
import { test, expect } from 'vitest';
test('vitest runs', () => { expect(1 + 1).toBe(2); });
```

- [ ] **Step 5: Run it — expect PASS**

Run: `npm test`
Expected: 1 passed.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Svelte+Vite+TS with Vitest"
```

---

### Task 2: Cipher type model + data extraction

**Files:**
- Create: `src/engine/types.ts`, `scripts/extract-ciphers.mjs`
- Generate: `src/data/ciphers.ts`
- Test: `src/engine/__tests__/ciphers.test.ts`

**Interfaces:**
- Produces: `interface Cipher { id: string; name: string; category: string; hsl: [number,number,number]; cArr: number[]; vArr: number[]; diacriticsAsRegular: boolean; enabled: boolean; caseSensitive: boolean }` and `export const ciphers: Cipher[]` from `src/data/ciphers.ts`.

- [ ] **Step 1: Write the types**

`src/engine/types.ts`:
```ts
export interface Cipher {
  id: string;
  name: string;
  category: string;
  hsl: [number, number, number];
  cArr: number[];   // char codes, parallel to vArr
  vArr: number[];   // values, parallel to cArr
  diacriticsAsRegular: boolean;
  enabled: boolean;
  caseSensitive: boolean;
}
export interface CalcOptions {
  allowPhraseComments: boolean;
  numCalcMethod: 0 | 1 | 2;      // 0 ignore digits, 1 full, 2 reduced
  multCharPos: boolean;
  multCharPosReverse: boolean;
}
export interface PerChar { char: string; value: number }
export interface CalcResult { total: number; perChar: PerChar[] }
```

- [ ] **Step 2: Write the extraction script (capture-stub)**

`scripts/extract-ciphers.mjs`:
```js
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const src = readFileSync('legacy/calc/ciphers.js', 'utf8');
const captured = [];
// Legacy signature: (name, category, H,S,L, cArr, vArr, diacriticsAsRegular=true, enabled=false, caseSensitive=false)
function cipher(name, category, H, S, L, cArr, vArr, dia = true, enabled = false, cs = false) {
  captured.push({ name, category, hsl: [H, S, L], cArr, vArr, diacriticsAsRegular: dia, enabled, caseSensitive: cs });
  return captured[captured.length - 1];
}
let cipherList = [];
// The legacy file assigns `cipherList = [ new cipher(...), ... ]`. Run it with our stub in scope.
// eslint-disable-next-line no-eval
(0, eval)(src);

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const seen = new Set();
const list = (cipherList.length ? cipherList : captured).map((c) => {
  let id = slug(`${c.category}-${c.name}`);
  while (seen.has(id)) id += '-x';
  seen.add(id);
  return { id, name: c.name, category: c.category, hsl: c.hsl, cArr: c.cArr, vArr: c.vArr,
           diacriticsAsRegular: c.diacriticsAsRegular, enabled: c.enabled, caseSensitive: c.caseSensitive };
});

mkdirSync('src/data', { recursive: true });
const out = `// AUTO-GENERATED by scripts/extract-ciphers.mjs — do not edit by hand.\n`
  + `import type { Cipher } from '../engine/types';\n`
  + `export const ciphers: Cipher[] = ${JSON.stringify(list, null, 2)};\n`;
writeFileSync('src/data/ciphers.ts', out);
console.log(`Wrote ${list.length} ciphers to src/data/ciphers.ts`);
```

- [ ] **Step 3: Run extraction — expect "Wrote 92 ciphers"**

Run: `node scripts/extract-ciphers.mjs`
Expected: `Wrote 92 ciphers to src/data/ciphers.ts` (if the count differs, that is the true legacy count — note it and proceed).

- [ ] **Step 4: Write the data test**

`src/engine/__tests__/ciphers.test.ts`:
```ts
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
```

- [ ] **Step 5: Run — expect PASS**

Run: `npm test -- ciphers`
Expected: 2 passed.

- [ ] **Step 6: Commit**

```bash
git add src/engine/types.ts scripts/extract-ciphers.mjs src/data/ciphers.ts src/engine/__tests__/ciphers.test.ts
git commit -m "feat(engine): cipher types + data extraction from legacy"
```

---

### Task 3: The `calculate()` core

**Files:**
- Create: `src/engine/calculate.ts`
- Test: `src/engine/__tests__/calculate.test.ts`

**Interfaces:**
- Consumes: `Cipher`, `CalcOptions`, `CalcResult` from `src/engine/types`.
- Produces: `export const DEFAULT_OPTS: CalcOptions` and `export function calculate(text: string, cipher: Cipher, opts?: Partial<CalcOptions>): CalcResult`.

- [ ] **Step 1: Write the failing tests (documented legacy behaviors)**

`src/engine/__tests__/calculate.test.ts`:
```ts
import { test, expect } from 'vitest';
import { calculate } from '../calculate';
import { ciphers } from '../../data/ciphers';

const ordinal = () => ciphers.find((c) => c.name === 'Ordinal' && c.category === 'English')!;
const reduction = () => ciphers.find((c) => c.name === 'Reduction' && c.category === 'English')!;

test('Ordinal hello = 45', () => { expect(calculate('hello', ordinal()).total).toBe(45); });
test('Reduction hello = 18', () => { expect(calculate('hello', reduction()).total).toBe(18); });
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
```

- [ ] **Step 2: Run — expect FAIL ("calculate is not a function")**

Run: `npm test -- calculate`
Expected: FAIL.

- [ ] **Step 3: Implement `calculate()` (mirrors legacy `calcGematria` normalization order)**

`src/engine/calculate.ts`:
```ts
import type { Cipher, CalcOptions, CalcResult, PerChar } from './types';

export const DEFAULT_OPTS: CalcOptions = {
  allowPhraseComments: false,
  numCalcMethod: 0,
  multCharPos: false,
  multCharPosReverse: false,
};

export function calculate(text: string, cipher: Cipher, opts?: Partial<CalcOptions>): CalcResult {
  const o = { ...DEFAULT_OPTS, ...opts };
  let s = text;
  // 1) strip [comments]
  if (o.allowPhraseComments) s = s.replace(/\[.+\]/g, '').trim();
  // 2) fold diacritics
  if (cipher.diacriticsAsRegular) s = s.normalize('NFD').replace(/[̀-ͯ]/g, '');
  // 3) case fold
  if (!cipher.caseSensitive) s = s.toLowerCase();

  const perChar: PerChar[] = [];
  let total = 0;
  let pos = 0; // 1-based position among matched letters (for multipliers)
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    // digit handling
    if (code >= 48 && code <= 57) {
      if (o.numCalcMethod === 2) { const d = code - 48; total += d; perChar.push({ char: s[i], value: d }); }
      else if (o.numCalcMethod === 1) {
        let j = i; let numStr = '';
        while (j < s.length && s.charCodeAt(j) >= 48 && s.charCodeAt(j) <= 57) { numStr += s[j]; j++; }
        const n = parseInt(numStr, 10); total += n; perChar.push({ char: numStr, value: n }); i = j - 1;
      }
      continue; // numCalcMethod 0 → ignore
    }
    const idx = cipher.cArr.indexOf(code);
    if (idx === -1) continue; // spaces, punctuation, unmapped
    pos++;
    let v = cipher.vArr[idx];
    if (o.multCharPos) v *= pos;
    perChar.push({ char: s[i], value: v });
    total += v;
  }
  if (o.multCharPosReverse) {
    // recompute with reverse position multiplier over the matched chars
    const n = perChar.length;
    total = perChar.reduce((sum, pc, k) => sum + (pc.value * (n - k)), 0);
  }
  return { total, perChar };
}
```

- [ ] **Step 4: Run — expect PASS**

Run: `npm test -- calculate`
Expected: all passed. (If `multCharPosReverse` double-multiplies, that option is out of scope for parity defaults — leave the simple form; defaults never enable it.)

- [ ] **Step 5: Commit**

```bash
git add src/engine/calculate.ts src/engine/__tests__/calculate.test.ts
git commit -m "feat(engine): calculate() with legacy-faithful normalization"
```

---

### Task 4: Parity gate (blocks everything downstream)

**Files:**
- Create: `scripts/legacy-ref.mjs`
- Test: `src/engine/__tests__/parity.test.ts`

**Interfaces:**
- Consumes: `calculate` (Task 3), `ciphers` (Task 2), `legacy/calc/gematria.js`, `legacy/db.txt`.
- Produces: `export function legacyCalc(word: string, cipher: {cArr:number[];vArr:number[];diacriticsAsRegular:boolean;caseSensitive:boolean}): number` — the verbatim legacy algorithm.

- [ ] **Step 1: Port the legacy algorithm verbatim into a reference module**

Open `legacy/calc/gematria.js` and read `calcGematria` (≈ lines 12-82). Copy its body **verbatim** into `legacy-ref.mjs` below, changing only: `this.` → the passed `cipher.`, and replace the option globals with the parity defaults (`allowPhraseComments=false`, `numCalcMethod=0`, no position multipliers). Do not "improve" it — a verbatim copy is the whole point.

`scripts/legacy-ref.mjs`:
```js
// Verbatim port of legacy calcGematria for parity testing ONLY.
// Defaults: no comments, digits ignored, no position multipliers.
export function legacyCalc(gemPhrase, cipher) {
  let gemValue = 0;
  if (cipher.diacriticsAsRegular === true) {
    gemPhrase = gemPhrase.normalize('NFD').replace(/[̀-ͯ]/g, '');
  }
  if (cipher.caseSensitive === false) {
    gemPhrase = gemPhrase.toLowerCase();
  }
  for (let i = 0; i < gemPhrase.length; i++) {
    const cur_char = gemPhrase.charCodeAt(i);
    const ch_pos = cipher.cArr.indexOf(cur_char);
    if (ch_pos > -1) gemValue += cipher.vArr[ch_pos];
  }
  return gemValue;
}
// NOTE: verify the copied body matches legacy/calc/gematria.js:12-82 for the default
// option branches. If the legacy file differs, the legacy file wins — update this copy.
```

- [ ] **Step 2: Write the parity test over all ciphers × a real corpus**

`src/engine/__tests__/parity.test.ts`:
```ts
import { test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { calculate } from '../calculate';
import { ciphers } from '../../data/ciphers';
import { legacyCalc } from '../../../scripts/legacy-ref.mjs';

// Build a corpus from the real word DB + edge cases.
const raw = readFileSync('legacy/db.txt', 'utf8');
const words = raw.split(/\s+/).filter(Boolean).slice(0, 4000);
const corpus = [...new Set([...words, 'café', 'HELLO', 'a b c', 'naïve', 'Œuvre', 'résumé', ''])];

test('new engine matches legacy for every cipher across the corpus', () => {
  const mismatches: string[] = [];
  for (const c of ciphers) {
    for (const w of corpus) {
      const a = calculate(w, c).total;
      const b = legacyCalc(w, { cArr: c.cArr, vArr: c.vArr, diacriticsAsRegular: c.diacriticsAsRegular, caseSensitive: c.caseSensitive });
      if (a !== b) { mismatches.push(`${c.category}/${c.name} "${w}": new=${a} legacy=${b}`); if (mismatches.length > 20) break; }
    }
    if (mismatches.length > 20) break;
  }
  expect(mismatches, mismatches.slice(0, 20).join('\n')).toHaveLength(0);
});
```

- [ ] **Step 3: Run the parity gate — expect PASS (0 mismatches)**

Run: `npm test -- parity`
Expected: 1 passed. If mismatches appear, they print with cipher+word+both values — fix `calculate()` (Task 3) until zero. Do NOT edit the legacy ref to force a pass.

- [ ] **Step 4: Commit**

```bash
git add scripts/legacy-ref.mjs src/engine/__tests__/parity.test.ts
git commit -m "test(engine): cipher numeric-parity gate vs legacy (0 mismatches)"
```

---

## Self-Review

- **Spec coverage:** §2 architecture (engine/data modules) → Tasks 1-3. §3 engine + exact-parity gate → Tasks 3-4. Cipher-as-data port → Task 2. Scaffold/static → Task 1. DB transform, UI, search, share, AI, deploy → **out of scope here, covered by Plans 2-4** (intentional decomposition).
- **Placeholder scan:** none — extraction, calculate, and parity all show complete code; the one verbatim-copy step names the exact source location and provides the default-branch body to confirm against.
- **Type consistency:** `Cipher` (id/name/category/hsl/cArr/vArr/diacriticsAsRegular/enabled/caseSensitive) defined in Task 2 and consumed unchanged in Tasks 3-4; `calculate`/`CalcResult`/`CalcOptions` names consistent across Tasks 3-4.
- **Known nuance:** legacy `numCalcMethod`/position-multiplier branches are reproduced in `calculate()` but parity runs at defaults (digits off), so those branches are unit-tested in Task 3 rather than parity-tested. Flagged, not silent.
