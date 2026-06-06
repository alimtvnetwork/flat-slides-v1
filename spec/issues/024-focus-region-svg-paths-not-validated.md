# 024 — Focus regions referencing missing SVG ids silently render no zoom

**Status:** open
**Area:** focus-region

## Symptom

Multi-step zoom slides advance steps but the camera never moves.

## Root cause

`CameraStage.focusTransform` resolves region ids from the slide JSON. Unknown ids return identity transform with no warning.

## Fix plan

1. In dev, `console.warn` when a focus id has no match. 2. Validate at import time: every step’s focus id must resolve. 3. Add fixture test.

## Acceptance

- Behavior described in **Symptom** no longer reproduces.
- A regression test from **Fix plan** is added and passes locally.
- Any spec doc referenced in **Fix plan** is created/updated in the same change.

## Status log

- 2026-06-06 — opened. RCA + fix plan ready. No code changes yet (per user request — fixes deferred).

- 2026-06-06 — **fixed**. Added `src/components/slides/validateFocusRegions.ts` (rejects unbound regions on step-aware slides, out-of-range `step`, and non-positive `w`/`h`). `parseDeckJson` / `parseSlideJson` now log a grouped `console.warn` listing every region issue without failing the import. `CameraStage` warns in dev when a slide has authored focus regions but none match the active step. Regression: `src/components/slides/validateFocusRegions.test.ts` (5/5 green).
