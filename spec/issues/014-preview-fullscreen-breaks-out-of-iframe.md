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

- 2026-06-06 (v1.32.0) — **Status check, NOT closed.** Audited `src/components/slides/useFullscreen.ts` against the original fix plan. Current behavior (since v1.30.0) is the OPPOSITE of step 1 of the plan: when `isEmbeddedWindow()` is true the code calls `openPresenterWindow()` immediately (lines 152–161) and only falls back to the in-app surface when the popup is blocked. The user-reported symptom ("preview breaks out of fullscreen") is therefore still reproducible — the popup IS the breakout. RCA 08 documented the popup-first contract but did NOT implement the in-iframe modal preference this issue asks for. Real next action: invert the branch — keep `setAppPresentationMode(true)` and return `{ ok: true, mode: "app" }` for the embedded case, expose an explicit "Open in window" affordance via `openPresenterWindow()` elsewhere, and update `fullscreenTarget.test.ts:65–86` which currently locks in the popup-first behavior. Estimated 60–90 min including test rewrite + docs/spec update.
