# 013 — `docs/slides/spec/sample-deck.json` is not validated in CI

**Status:** open
**Area:** spec sample deck

## Symptom

If the spec sample drifts from the schema, the “Try spec sample deck” button silently fails for users.

## Root cause

`src/lib/slides/sample-deck.test.ts` exists but only checks structural shape, not full `DeckSchema.parse`. The `?raw` import in `SettingsDrawer` bypasses any compile-time check.

## Fix plan

1. Replace the structural assertions with `DeckSchema.parse(JSON.parse(raw))`. 2. Add an end-to-end test that mounts `SettingsDrawer`, clicks the sample button, and asserts no error toast fires.

## Acceptance

- Behavior described in **Symptom** no longer reproduces.
- A regression test from **Fix plan** is added and passes locally.
- Any spec doc referenced in **Fix plan** is created/updated in the same change.

## Status log

- 2026-06-06 — opened. RCA + fix plan ready. No code changes yet (per user request — fixes deferred).
