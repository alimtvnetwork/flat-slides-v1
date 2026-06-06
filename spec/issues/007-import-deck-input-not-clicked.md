# 007 — “Import deck” button shows the file dialog inconsistently in Safari

**Status:** open
**Area:** pickJsonFile

## Symptom

On Safari (and some embedded iframes) clicking Import deck does nothing. Chrome works. No error in console.

## Root cause

`pickJsonFile` creates a detached `<input type=file>` and calls `.click()`. Safari requires the input to be in the DOM and the click to happen inside the same task as the user gesture. The current code awaits a Promise wrapper that schedules `.click()` after a microtask, breaking the gesture chain.

## Fix plan

1. Reuse the hidden `fileRef` input already rendered in `SettingsDrawer` (line 435) instead of creating a fresh one each call. 2. Trigger `click()` synchronously inside the button handler. 3. Resolve via the input’s `change` event. 4. Add a Playwright spec `import-deck-safari.spec.ts` (manual until CI has Webkit).

## Acceptance

- Behavior described in **Symptom** no longer reproduces.
- A regression test from **Fix plan** is added and passes locally.
- Any spec doc referenced in **Fix plan** is created/updated in the same change.

## Status log

- 2026-06-06 — opened. RCA + fix plan ready. No code changes yet (per user request — fixes deferred).
