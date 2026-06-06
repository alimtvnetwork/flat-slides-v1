# 009 — Exported deck JSON does not round-trip presenter annotations or camera prefs

**Status:** open
**Area:** exportDeck

## Symptom

User customizes camera shape/size, draws annotations, exports the deck, re-imports it on another machine — none of those customizations come back.

## Root cause

`exportDeck` serializes only `deck` (slides + settings). Camera state lives in `useChrome` (localStorage `riseup.chrome.*`), annotations in `useAnnotations` (`riseup.annotations.*`), webcam prefs under `riseup.webcam.*`. None are included.

## Fix plan

1. Add `deck.meta.exportedAt` and `deck.meta.runtime: { chrome, annotations, webcam }` as optional fields under the DeckSchema. 2. `exportDeck` snapshots from each store. 3. `parseDeckJson` hydrates those stores when present (behind a toast prompt: “Restore annotations and camera from file?”). 4. Document in `docs/slides/spec/import-export.spec.md`.

## Acceptance

- Behavior described in **Symptom** no longer reproduces.
- A regression test from **Fix plan** is added and passes locally.
- Any spec doc referenced in **Fix plan** is created/updated in the same change.

## Status log

- 2026-06-06 — opened. RCA + fix plan ready. No code changes yet (per user request — fixes deferred).
