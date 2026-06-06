# 008 — Import failure toast hides the offending JSON path past 4 errors

**Status:** open
**Area:** io.parseDeckJson / formatZodError

## Symptom

User imports a deck with multiple issues; toast shows 4 lines and clips. User cannot tell which slide is broken.

## Root cause

`formatZodError` in `src/lib/slides/io.ts` slices to the first 4 issues and joins with `\n`. Toast UI also truncates long content.

## Fix plan

1. Show the first 4 issues in the toast + a “Copy full error” action that writes the entire Zod issue list to clipboard. 2. Optionally log the full list via `console.warn` for devtools. 3. Add a unit test for >4 issues asserting the truncated count and that the full error is available.

## Acceptance

- Behavior described in **Symptom** no longer reproduces.
- A regression test from **Fix plan** is added and passes locally.
- Any spec doc referenced in **Fix plan** is created/updated in the same change.

## Status log

- 2026-06-06 — opened. RCA + fix plan ready. No code changes yet (per user request — fixes deferred).

- 2026-06-06 — **fixed**. `parseDeckJson`/`parseSlideJson` now return `{ error, errorFull, errorCount }`. `SettingsDrawer` shows a sonner toast with a `Copy full error` action and a `…and N more` suffix, plus `console.warn` of the full list. Regression: `src/lib/slides/io-zod-error.test.ts` (2/2 green).
