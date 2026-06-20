# Cyphers — Gematria Calculator

A fast, mobile-first gematria calculator. This is a ground-up **Svelte + Vite + TypeScript** rewrite of the Cyphers / Gematro / Hyperdope tool, with a "Phosphor Decoder" terminal interface.

**Live:** https://gematro-hyperdope.pages.dev

> Status: active overhaul. **Done** — gematria engine (91 ciphers) with an exact numeric-parity gate against the original, the calculator UI, and live phrase matching against the ~97k-phrase database. **Planned** — power search / reverse lookup, AI "decode" interpretation, shareable result cards, saved workspaces, and a visual-polish pass. See `docs/superpowers/`.

## Features

- **91 ciphers** extracted from the original as typed data, computed by a pure, framework-agnostic engine.
- **Exact parity** with the legacy calculator — a test harness diffs every cipher × thousands of real words (0 mismatches), so a fresh codebase never silently changes a value.
- **Live phrase matching** — type a phrase and instantly see other phrases from a ~97k-entry database that share its value, computed off the main thread in a Web Worker so typing never janks.
- **3 terminal palettes** (green / amber / cyan), mobile-first, works fully static and offline.

## Tech stack

Svelte 5 + Vite + TypeScript · Vitest (unit + parity) · static build, deployed to Cloudflare Pages.

## Develop

```bash
git clone https://github.com/CodePhantom-1/gematro-hyperdope.git
cd gematro-hyperdope
npm install
npm run dev          # local dev server
npm test             # unit + parity tests
npm run check        # svelte-check + tsc
npm run build        # production build → dist/
npm run preview      # serve the production build locally
```

Regenerate data when the source changes:

```bash
node scripts/extract-ciphers.mjs   # legacy/calc/ciphers.js → src/data/ciphers.ts
node scripts/build-db.mjs          # legacy/db.txt → public/cyphers-db.txt
```

## Deploy

Static build to Cloudflare Pages:

```bash
npm run build
npx wrangler pages deploy dist --project-name gematro-hyperdope
```

## Project layout

| Path | What |
|---|---|
| `src/engine/` | Pure gematria engine: cipher calculation, matching, parity tests. No DOM. |
| `src/data/` | `ciphers.ts` — the 91 cipher definitions as typed data (generated). |
| `src/stores/` | Reactive state: settings (palette, enabled ciphers), calculator, matches. |
| `src/lib/`, `src/routes/` | UI components + the calculator screen. |
| `src/worker/` | Web Worker that scans the phrase database off the main thread. |
| `public/cyphers-db.txt` | The phrase database (generated static asset, fetched at runtime). |
| `legacy/` | The original vanilla-JS app, preserved verbatim as the parity reference. |
| `docs/superpowers/` | Design spec + per-plan implementation plans. |

## License

Distributed under the GNU General Public License v2.0. See `LICENSE`.

## Acknowledgments

Built on the lineage of the original project:

- **[Gematro](https://github.com/gematro)** by Saun-Virroco (Mikhail) — the calculator this is based on.
- **[NetVoid](https://github.com/CyphersNews/cyphersnews.github.io)** — preserved the Gematro repo and secured the database.
- **[Alektryon](https://github.com/Alektryon)** — many ciphers, configurations, and reviews.
- **[Hyperdope](https://github.com/malonehunter/hyperdope-gematria)** — restored the live-database option and began narrowing the database.
- Upstream this fork tracks: **[CyphersNews/gematro-hyperdope](https://github.com/CyphersNews/gematro-hyperdope)**.
