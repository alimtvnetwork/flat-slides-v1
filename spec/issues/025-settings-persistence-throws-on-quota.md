# 025 — SettingsDrawer changes are lost when localStorage quota is full

**Status:** open
**Area:** settingsPersistence

## Symptom

Edge case: users with many decks stored hit the 5 MB cap; settings appear to revert silently.

## Root cause

`settingsPersistence.writePayload` swallows `QuotaExceededError`.

## Fix plan

1. Catch and toast `“Storage full — settings not saved.”`. 2. Provide “Clear saved decks” action. 3. Unit test the quota path with a mocked `Storage` throwing.

## Acceptance

- Behavior described in **Symptom** no longer reproduces.
- A regression test from **Fix plan** is added and passes locally.
- Any spec doc referenced in **Fix plan** is created/updated in the same change.

## Status log

- 2026-06-06 — opened. RCA + fix plan ready. No code changes yet (per user request — fixes deferred).
