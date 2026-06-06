# 019 — Annotations from a previous deck render on the new deck after import

**Status:** open
**Area:** annotations-store

## Symptom

Visual: red ink from deck A bleeds onto deck B slide 1 after import.

## Root cause

`useAnnotations` keys entries by `slideId` only, not by `deckId`. Two decks with overlapping slide ids share annotation buckets.

## Fix plan

1. Key annotations by `${deckId}:${slideId}`. 2. Add a migration that drops entries lacking a deckId prefix. 3. Regression test in `annotations-store.test.ts`.

## Acceptance

- Behavior described in **Symptom** no longer reproduces.
- A regression test from **Fix plan** is added and passes locally.
- Any spec doc referenced in **Fix plan** is created/updated in the same change.

## Status log

- 2026-06-06 — opened. RCA + fix plan ready. No code changes yet (per user request — fixes deferred).

## Fix (2026-06-06, v1.4.0)

Chose **clear-on-replace** over the original `${deckId}:${slideId}`
keying plan. `useDeck.setDeck` already invokes
`useAnnotations.getState().clearAll()` (store.ts:224) — that wipes the
bug at the source without requiring a storage migration or breaking
existing persisted entries. Annotations are session-only by default
(see `annotations-store.ts` `persistStrokes` flag), so clearing on
deck swap matches user intent.

Regression: `src/components/slides/annotations-cross-deck.test.ts` — seeds a stroke on deck A's first slide id, calls `setDeck` with deck B reusing the SAME slide id, asserts `strokes === {}`.

- 2026-06-06 — fixed in v1.4.0.
