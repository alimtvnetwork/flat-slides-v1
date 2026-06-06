# 029 — Controller pill anchor sticks to old corner after the window is resized

**Status:** open
**Area:** controller-anchor-store

## Symptom

Anchor is set to bottom-right; user resizes the window narrow — pill overflows off-screen instead of re-anchoring.

## Root cause

`controller-anchor.ts` reads viewport once on mount.

## Fix plan

1. Add a `resize` listener that re-clamps anchor to visible bounds. 2. Test with a `resize` event in `controller-anchor.test.ts`.

## Acceptance

- Behavior described in **Symptom** no longer reproduces.
- A regression test from **Fix plan** is added and passes locally.
- Any spec doc referenced in **Fix plan** is created/updated in the same change.

## Status log

- 2026-06-06 — opened. RCA + fix plan ready. No code changes yet (per user request — fixes deferred).
