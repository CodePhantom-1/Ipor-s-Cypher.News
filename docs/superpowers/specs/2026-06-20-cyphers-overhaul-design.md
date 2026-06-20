# Cyphers Gematria — Ground-Up Overhaul (Design Spec)

**Date:** 2026-06-20 · **Repo:** `CodePhantom-1/gematro-hyperdope` (fork of `CyphersNews/gematro-hyperdope`) · **Branch:** `overhaul`

## 1. Goal & constraints

Rebuild the Cyphers / Gematro / Hyperdope gematria calculator from the ground up:
modern, fast, mobile-first, visually distinctive, with expanded features — while
**preserving exact cipher correctness** and staying **static-hostable**.

- **Stack:** Svelte + Vite + TypeScript, static output.
- **Deploy:** Cloudflare Pages (static assets + one Pages Function for AI), domain `cyphers.news` (existing CNAME). Also runnable on GitHub Pages (everything except the server-side AI key; see §7).
- **Hard rule:** no server backend beyond the single Cloudflare Pages Function. App is client-side.
- **Non-negotiable:** every cipher must produce values identical to the legacy app (see §3 parity gate). A gematria tool that silently miscounts is worthless.

## 2. Architecture / module boundaries

Replace the legacy monoliths (`calc.js` 77KB, `quick-guide.js` 120KB, 10 near-duplicate ~26KB theme files, jQuery, html2canvas) with focused modules:

| Module | Responsibility | Depends on |
|---|---|---|
| `src/engine/` | Pure, DOM-free gematria core: `calculate(text, cipher)`, breakdown, encoding, date-calc, number properties. Framework-agnostic, exhaustively unit-tested. | nothing |
| `src/data/` | Cipher definitions (typed data ported from `ciphers.js`); DB loader + index types. | engine types |
| `src/stores/` | Svelte stores: input, active ciphers, history, saved workspaces, settings; persisted to localStorage. | engine |
| `src/ui/` | Svelte components: calculator, cipher grid, results, DB matches, search, share-card, compare, settings. Terminal design system. | engine, stores |
| `src/features/` | share-cards (canvas render), search (Web Worker), AI client, compare. | engine, data |
| `src/worker/` | Web Worker for DB matching + search (keeps main thread jank-free on the 2MB DB). | data |
| `functions/api/decode.ts` | Cloudflare Pages Function: OpenRouter proxy for AI "decode" (server-side key). | — |

**Design intent:** each unit has one clear purpose, a small typed interface, and is
testable in isolation. No file should grow into a new monolith.

## 3. The engine (correctness-critical)

- **Port every cipher as typed data**, not code: `{ id, name, kind, map: Record<string, number>, options }`. Source of truth extracted from the legacy `calc/ciphers.js`.
- **Pure functions:** `calculate(text, cipher) → { total, perChar: {char, value}[] }`, plus encoding, date-calc, breakdown, number-properties — all pure, no DOM.
- **Parity gate (blocks the rewrite from shipping):** a Vitest harness runs a large corpus (a sample of `db.txt` + edge cases: diacritics, Unicode, mixed case, spaces, digits) through **both** the legacy engine and the new engine and asserts identical totals for **every** cipher. 100% parity required before the new engine replaces anything.
- **Exact parity (decided):** the new engine matches legacy output bug-for-bug — no "corrections" during the rewrite. Any genuine cipher errors are fixed afterward as separate, individually-reviewed changes with their own parity-diff record, so corrections are deliberate and auditable rather than silent.

## 4. Database & search

- **Build-time transform** `db.txt` (2MB plaintext) → an optimized indexed artifact: tokenized phrase list + a **value→phrases reverse index** for the default ciphers so "find every phrase that equals N" is instant.
- **Lazy-load** the DB after first paint; run all matching/search inside `src/worker/` (Web Worker) so typing and scrolling never block.
- **Power search:** full-text phrase search, value filters (`= / range`), reverse lookup (value → phrases), multi-cipher matching, sort/compare.

## 5. UI / UX — cyber-decoder terminal, mobile-first

- **Aesthetic:** dark base, monospace numerals, neon accent, restrained scanline + glitch-on-reveal, a **perf-gated code-rain hero** (disabled by default on mobile / `prefers-reduced-motion` / low-power). Executed to a high polish — distinctive, not hacker-cliché. Driven through the frontend-design process during build.
- **Single reactive screen:** input → live cipher grid → DB matches, all updating as you type.
- **Mobile-first:** responsive layout, touch virtual keyboard, bottom-sheet panels, large tap targets. Removes the legacy "use a desktop browser" limitation.
- **Palettes:** 3 terminal variants (green / amber / cyan) via CSS custom properties — replaces the 10 duplicated theme JS files.
- **Preserved core features:** calculator, custom ciphers (add/edit, Unicode), live DB matching, history table (edit/export/import CSV), highlighter + filtering, date-calc, number properties, screenshot/share, quickstart guide.

## 6. New features

1. **Shareable result cards** — render a polished terminal-styled card (HTML/canvas → PNG, replacing html2canvas with a lighter modern path) plus a **shareable URL** that encodes state in the hash (`#q=...&c=...`) so a link reproduces the exact result. One-tap social sharing.
2. **AI "decode" interpretation** — `functions/api/decode.ts` proxies OpenRouter (key as a Cloudflare env var, never client-side). **Reliability:** pin a concrete free model (env `OPENROUTER_MODEL`, default a current free instruct model) with **retry-on-empty + fallback to `openrouter/free`** — because the free *router* alone returns empty responses intermittently. Response streamed to the client. **GitHub Pages fallback:** if no Function is present, accept a user-supplied OpenRouter key stored locally.
3. **Saved workspaces + compare** — localStorage-backed sessions (no account/backend), side-by-side multi-phrase / multi-cipher comparison, pinned results.

## 7. Deploy

- **Primary — Cloudflare Pages:** static Svelte build + `functions/api/decode.ts`. Secrets (`OPENROUTER_API_KEY`, `OPENROUTER_MODEL`) as Pages env vars. Custom domain `cyphers.news`.
- **Secondary — GitHub Pages:** the static build works fully *except* server-side AI; there the decode feature uses the user-supplied-key fallback. Keep `CNAME` handling compatible.
- **Key hygiene:** the pasted OpenRouter key must be set only as a Cloudflare env var and **rotated** (it was shared in chat).

## 8. Testing

- **Vitest:** engine unit tests + the §3 parity harness; search/reverse-index correctness; share-card state encode/decode round-trip; AI Function (mocked) retry/fallback logic.
- **Playwright:** smoke flow — type a phrase, see cipher values + DB matches, generate a share card, run a search.

## 9. Phasing (feeds the implementation plan)

- **P0 — Modernized feature-parity core:** project scaffold (Svelte+Vite+TS), `engine/` + cipher data + **parity gate green**, calculator UI + live DB matching (Web Worker), terminal design system + mobile layout, history/export, custom ciphers, Cloudflare Pages deploy.
- **P1 — Power + share:** power search / reverse lookup, shareable result cards + share URLs, saved workspaces + compare.
- **P2 — AI:** `/api/decode` Function (pinned-model + retry/fallback), streamed decode UI, user-key fallback.

## 10. Out of scope (YAGNI for now)

User accounts / server-side sync (localStorage only), payments/monetization, the 10
legacy theme files (replaced by 3 palettes), jQuery / html2canvas (removed).
