# 026 — Theme `fg` is unreadable over user-supplied background image

**Status:** open
**Area:** theming

## Symptom

User uploads a bright background; default white-on-image is fine but default dark theme’s `fg` (`#101010`) becomes invisible.

## Root cause

No contrast adjustment when `backgroundMode === 'image'`. The “Darken” slider helps but is opt-in.

## Fix plan

1. When `backgroundMode === 'image'`, default `darken` to 35. 2. Add a “Auto-contrast” toggle that flips fg to the higher-contrast option vs the average image luminance (measured via canvas).

## Acceptance

- Behavior described in **Symptom** no longer reproduces.
- A regression test from **Fix plan** is added and passes locally.
- Any spec doc referenced in **Fix plan** is created/updated in the same change.

## Status log

- 2026-06-06 — opened. RCA + fix plan ready. No code changes yet (per user request — fixes deferred).
