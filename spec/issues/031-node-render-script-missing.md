# 031 — No headless Node renderer to produce PNG/PDF previews of slides

**Status:** open
**Area:** tooling

## Symptom

User asked: build slides from JSON via Node — there is no script that renders thumbnails for sharing, AI inspection, or social previews.

## Root cause

All rendering happens in the browser via React + scale transform.

## Fix plan

1. Add `scripts/render-deck.ts` using `@playwright/test`’s chromium to load `/slides/print` and screenshot each `.slide-content` to `out/decks/{deckId}/{n}.png`. 2. Cache by deck hash. 3. Use in `og:image` derivation per issue tanstack-route-architecture rules.

## Acceptance

- Behavior described in **Symptom** no longer reproduces.
- A regression test from **Fix plan** is added and passes locally.
- Any spec doc referenced in **Fix plan** is created/updated in the same change.

## Status log

- 2026-06-06 — opened. RCA + fix plan ready. No code changes yet (per user request — fixes deferred).
