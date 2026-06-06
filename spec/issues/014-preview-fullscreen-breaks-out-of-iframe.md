# 014 — Pressing F/Present in preview iframe escapes to top window unexpectedly

**Status:** open
**Area:** useFullscreen / presenter-window

## Symptom

User reports “the preview breaks out of fullscreen” when entering Present from the in-app preview.

## Root cause

After issue 001 was fixed, embedded contexts always open a new top-level window via `openPresenterWindow`. From the Lovable preview that popup is a separate browser tab, which the user perceives as the preview “breaking out”. There is no in-iframe fallback (an in-iframe modal “Present mode” surface).

## Fix plan

1. Add an in-iframe presentation surface: a full-bleed modal inside the iframe that mimics fullscreen using `position: fixed; inset: 0`. 2. Prefer this surface when `isEmbeddedWindow() && !canRequestFullscreen()`. 3. Only fall back to popup when the user explicitly clicks “Open in window”. 4. Document in `docs/slides/spec/present-fullscreen.spec.md` §6.

## Acceptance

- Behavior described in **Symptom** no longer reproduces.
- A regression test from **Fix plan** is added and passes locally.
- Any spec doc referenced in **Fix plan** is created/updated in the same change.

## Status log

- 2026-06-06 — opened. RCA + fix plan ready. No code changes yet (per user request — fixes deferred).
