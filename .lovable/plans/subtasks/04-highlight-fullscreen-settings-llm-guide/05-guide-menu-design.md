# Subtask 05 — Guide menu + zip download design

**Slug:** guide-menu-design
**Status:** pending
**Created:** 2026-06-06
**Parent:** 04-highlight-fullscreen-settings-llm-guide

## Scope

Define exactly what each downloadable zip contains, how it is built, and how versioning is stamped.

## Zips

### `lovable-slides-llm-guide.zip`
- `README.md` — short "feed this folder to your LLM" intro + version stamp.
- `llm-json-guideline.md` ← `docs/slides/spec/llm-json-guideline.md`
- `sample-deck.json` ← `docs/slides/spec/sample-deck.json`
- `slides-README-LLM.md` ← `slides/README-LLM.md`
- `schema.json` ← JSON schema exported from `src/lib/slides/schema.ts` (Zod → JSON Schema).

### `lovable-slides-theme-guide.zip`
- `README.md` — theme authoring intro + version stamp.
- `theme-system.md` ← `spec/old-slides/21-slides-system/07-theme-system.md`
- `palette.md` ← `assets/icons/colors-themes/Palette.md`
- `themes.ts.txt` ← raw export of theme token definitions.

### `lovable-slides-slide-json-guide.zip`
- `README.md` — slide-level JSON intro + version stamp.
- All `docs/slides/spec/*.spec.md` files.
- `schema.json` (same as LLM guide).

### `lovable-slides-all-guides.zip`
- Concatenation of the three above under top-level folders `llm/`, `theme/`, `slide-json/`.

## Build path

- `src/lib/slides/guide-zip.ts` — exports `buildGuideZip(kind)` returning a `Blob`.
- Use `fflate` (Worker-compatible, ~20KB, no Node deps).
- Inline all source markdown via Vite `?raw` so the zip is pure client-side.
- Stamp every `README.md` with `Generated: ${ISO date}` + `App version: ${pkg.version}`.

## Trigger

Each Settings → Guide button calls `buildGuideZip(kind)` then `URL.createObjectURL` + a temporary `<a download>` click. No server round-trip.

## Test

`guide-zip.test.ts` unzips the produced blob (via `fflate.unzipSync`) and asserts file names + non-empty bodies.
