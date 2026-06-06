# 023 — Imported decks lose `.hl` highlight spans authored as `<mark>`

**Status:** open
**Area:** Rich + DeckSchema

## Symptom

JSON that contains `<mark>` markup is rendered as plain text after import.

## Root cause

`Rich` component runs through a sanitizer that allows only a whitelist; `mark` was dropped when the highlight system moved to `data-hl`.

## Fix plan

1. Add `mark` back to the sanitizer whitelist OR transform `<mark>` → `<span class="hl">` in `parseDeckJson`. 2. Lock with `rich-highlights-import.test.tsx`.

## Acceptance

- Behavior described in **Symptom** no longer reproduces.
- A regression test from **Fix plan** is added and passes locally.
- Any spec doc referenced in **Fix plan** is created/updated in the same change.

## Status log

- 2026-06-06 — opened. RCA + fix plan ready. No code changes yet (per user request — fixes deferred).
