# 010 — Importing a deck does not reset slide index, annotations, or audience state

**Status:** open
**Area:** useDeck.setDeck

## Symptom

After import, current slide URL still points to the old slide id and may 404. Audience BroadcastChannel keeps the previous deck id. Annotations from the previous deck are still visible.

## Root cause

`useDeck.setDeck(deck)` swaps `state.deck` but does not navigate, does not clear `useAnnotations`, and does not bump `audience.deckId`.

## Fix plan

1. After `setDeck`, navigate to `/slides/1` via `router.navigate` (or emit a `'deck:changed'` event the route layout listens to). 2. Call `useAnnotations.getState().clear()`. 3. Bump the audience channel `deckId`. 4. Add `import-deck-side-effects.test.tsx`.

## Acceptance

- Behavior described in **Symptom** no longer reproduces.
- A regression test from **Fix plan** is added and passes locally.
- Any spec doc referenced in **Fix plan** is created/updated in the same change.

## Status log

- 2026-06-06 — opened. RCA + fix plan ready. No code changes yet (per user request — fixes deferred).
