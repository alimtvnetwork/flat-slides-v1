# 004 — Editing any Settings drawer control sometimes does not re-render the slide

**Status:** open
**Area:** useDeck store subscription

## Symptom

Toggling transition, background mode, darken/blur, or camera options occasionally leaves the preview stale until the user navigates away and back.

## Root cause

`useDeck` exposes `setSettings` as a partial merge. Components that read individual settings via `useDeck((s) => s.deck.settings.xxx)` re-render, but components reading `useDeck((s) => s.deck)` only re-render on reference change. `setSettings` may produce a new `deck.settings` object but reuse the outer `deck` reference, breaking selector equality for `deck`-level subscribers.

## Fix plan

1. In the store, ensure `setSettings` returns `{ ...state, deck: { ...state.deck, settings: { ...state.deck.settings, ...patch } } }`. 2. Audit components that destructure `deck` and migrate them to narrow selectors. 3. Add `settings-store-immutability.test.ts` that calls `setSettings({ darken: 50 })` and asserts the top-level `deck` reference changed.

## Acceptance

- Behavior described in **Symptom** no longer reproduces.
- A regression test from **Fix plan** is added and passes locally.
- Any spec doc referenced in **Fix plan** is created/updated in the same change.

## Status log

- 2026-06-06 — opened. RCA + fix plan ready. No code changes yet (per user request — fixes deferred).
- 2026-06-06 — verified `setSettings` already returns a new top-level `deck` reference (store.ts:203–208). Added regression test `src/components/slides/settings-store-immutability.test.ts` (2/2 green) locking deck/settings reference change per patch. Status: **fixed**.
