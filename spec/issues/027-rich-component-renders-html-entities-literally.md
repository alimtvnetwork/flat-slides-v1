# 027 — `&amp;` and `&mdash;` render as literal text in slide bodies

**Status:** open
**Area:** Rich

## Symptom

Authors paste HTML-entity-encoded copy into deck JSON; viewers see raw ampersands.

## Root cause

`Rich` calls `React.createElement` with the string as children — no entity decoding.

## Fix plan

1. Decode entities via a small utility (or use `dangerouslySetInnerHTML` with the existing sanitizer). 2. Add `rich-entities.test.tsx`.

## Acceptance

- Behavior described in **Symptom** no longer reproduces.
- A regression test from **Fix plan** is added and passes locally.
- Any spec doc referenced in **Fix plan** is created/updated in the same change.

## Status log

- 2026-06-06 — opened. RCA + fix plan ready. No code changes yet (per user request — fixes deferred).

- 2026-06-06 — **fixed**. Added `src/components/slides/decodeEntities.ts` (named + numeric + hex refs, SSR-safe). `Rich` now decodes both plain string parts and `Highlight.text`. Regression: `src/components/slides/rich-entities.test.tsx` (5/5 green).
