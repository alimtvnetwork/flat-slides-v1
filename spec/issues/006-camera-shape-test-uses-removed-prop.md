# 006 — `CameraBubble.shape.test.tsx` exercises an API the component no longer exposes

**Status:** open
**Area:** CameraBubble shape contract

## Symptom

Test compiles and runs, but only because it was patched in a prior turn. Behavior under test (`shape: 'rect' → border-radius: 0`) is not asserted on the real production render path.

## Root cause

The test imports `CameraBubble` and passes `shape` directly as a prop, but production code reads `camera.shape` from the `useChrome` store. The test therefore never catches regressions in the store-driven path.

## Fix plan

1. Refactor the test to set `useChrome.setState({ camera: { ...camera, shape: 'rect' } })` and render `<CameraBubble />` without props. 2. Keep the three shape cases (circle, squircle, rect). 3. Lock acceptable computed `border-radius` ranges in `docs/slides/spec/camera.spec.md`.

## Acceptance

- Behavior described in **Symptom** no longer reproduces.
- A regression test from **Fix plan** is added and passes locally.
- Any spec doc referenced in **Fix plan** is created/updated in the same change.

## Status log

- 2026-06-06 — opened. RCA + fix plan ready. No code changes yet (per user request — fixes deferred).
