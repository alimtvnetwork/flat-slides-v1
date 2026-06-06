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
