# 011 — Importing a deck with embedded base64 images can silently fail validation

**Status:** open
**Area:** DeckSchema (Zod)

## Symptom

Deck JSON authored via the LLM spec uses `data:` URLs for images. Large (~2-3 MB) base64 strings cause Zod validation to be slow and sometimes abort with a non-descriptive “string too big” error.

## Root cause

`SlideSchema` validates image URLs as `z.string().url()` which accepts data URLs but does not enforce a size limit; in some Worker runtimes the JSON parser also throws on > Worker request limit.

## Fix plan

1. Add explicit `z.string().max(4_000_000)` on image fields with a clear message. 2. In `parseDeckJson`, pre-check raw length and bail with a friendly error if > 8 MB. 3. Update `docs/slides/spec/llm-json-guideline.md` with the limit. 4. Add a fixture test with a 5 MB image to lock the error.

## Acceptance

- Behavior described in **Symptom** no longer reproduces.
- A regression test from **Fix plan** is added and passes locally.
- Any spec doc referenced in **Fix plan** is created/updated in the same change.

## Status log

- 2026-06-06 — opened. RCA + fix plan ready. No code changes yet (per user request — fixes deferred).

- 2026-06-06 — **fixed**. Added `ImageSrcSchema` (per-image cap `MAX_IMAGE_SRC_BYTES = 4_000_000`, friendly message pointing at hosted URLs) and replaced the inline `z.string().url().or(...data:)` unions in `LeftSlideSchema` and `ImageSlideSchema`. `parseDeckJson`/`parseSlideJson` short-circuit when `raw.length > MAX_DECK_JSON_BYTES (8 MB)` with a single readable error. Regression: `src/lib/slides/io-image-size.test.ts` (4/4 green).
