# 020 — Refreshing the popup presenter window resets to the default sample deck

**Status:** open
**Area:** presenterWindowUrl + store hydration

## Symptom

User loads a custom deck in the main tab, opens presenter window, hits ⌘R in the popup — back to default deck.

## Root cause

Popup loads `/slides/N` and hydrates `useDeck` from its own `localStorage` scope. If the user imported via the main tab only, the popup never received the new deck because storage events aren’t propagated until the next write.

## Fix plan

1. Listen for `storage` events in `useDeck` and rehydrate. 2. On popup open, post a `deck:sync` message via BroadcastChannel from the opener. 3. Test with two windows in `presenterWindowSync.test.ts`.

## Acceptance

- Behavior described in **Symptom** no longer reproduces.
- A regression test from **Fix plan** is added and passes locally.
- Any spec doc referenced in **Fix plan** is created/updated in the same change.

## Status log

- 2026-06-06 — opened. RCA + fix plan ready. No code changes yet (per user request — fixes deferred).

## Fix (2026-06-06, v1.4.0)

Added `syncDeckAcrossWindows()` in `src/components/slides/store.ts`. On module load (browser only) it registers a `window.storage` listener that calls `useDeck.persist.rehydrate()` whenever another window writes `slides-deck-v1`. Unrelated keys and removal events (`newValue === null`) are ignored so closing a tab can't wipe the popup's state.

Regression: `src/components/slides/store-cross-window-sync.test.ts` — spies on `useDeck.persist.rehydrate`, dispatches relevant + unrelated `StorageEvent`s, asserts rehydrate fires for `slides-deck-v1` only.

- 2026-06-06 — fixed in v1.4.0.
