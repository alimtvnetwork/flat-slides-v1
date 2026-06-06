# 022 — Deck music never starts in the preview iframe

**Status:** open
**Area:** deckMusicPlayer

## Symptom

User enables music, expects audio on slide change — silent.

## Root cause

Browsers block autoplay until a user gesture; the autoplay-recovery hook arms a retry but iframes have stricter rules. Recovery never fires because the controller pill is hidden initially.

## Fix plan

1. Surface a one-time “Click to enable audio” affordance on first slide render when music is enabled. 2. Persist the gesture grant in `riseup.audio.unlocked`. 3. Add `musicPlayback.iframe.test.ts`.

## Acceptance

- Behavior described in **Symptom** no longer reproduces.
- A regression test from **Fix plan** is added and passes locally.
- Any spec doc referenced in **Fix plan** is created/updated in the same change.

## Status log

- 2026-06-06 — opened. RCA + fix plan ready. No code changes yet (per user request — fixes deferred).
