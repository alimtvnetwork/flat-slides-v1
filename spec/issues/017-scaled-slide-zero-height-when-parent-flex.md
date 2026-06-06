# 017 — ScaledSlide renders 0 px tall inside flex parents that don’t set `min-height`

**Status:** open
**Area:** ScaledSlide layout

## Symptom

Recurring root cause of “blank preview”. Reported again here.

## Root cause

ScaledSlide measures parent via `ResizeObserver`. If parent has `display: flex; flex: 1` without `min-height: 0`, the parent collapses to 0. Already noted in `mem://bugs/slides-routing` — needs a guardrail.

## Fix plan

1. In `ScaledSlide`, when measured size is 0 emit a `console.warn` in dev. 2. Add `data-debug-zero-height` attribute for selector-based testing. 3. Extend `ScaledSlide.test.tsx` with a flex-parent fixture.

## Acceptance

- Behavior described in **Symptom** no longer reproduces.
- A regression test from **Fix plan** is added and passes locally.
- Any spec doc referenced in **Fix plan** is created/updated in the same change.

## Status log

- 2026-06-06 — opened. RCA + fix plan ready. No code changes yet (per user request — fixes deferred).
