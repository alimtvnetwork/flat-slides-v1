# 015 — Settings gear vanishes from controller pill below 1280 CSS px

**Status:** open
**Area:** ControllerPill / ControllerOverflowMenu

## Symptom

On a 993-px-wide preview viewport, clicking the Settings gear yields no drawer because the gear isn’t actually in the visible pill — it’s moved into the overflow menu but the overflow menu’s click handler routes to a different action id.

## Root cause

`ControllerOverflowMenu` maps shortcut ids → actions via `SHORTCUTS`. The settings action id was renamed in a prior step but the overflow menu still references the old id, so the menu item exists but is a no-op.

## Fix plan

1. Add a `presenterActions.parity` test that asserts every entry in the overflow menu resolves to a non-null action in the registry. 2. Fix the stale id. 3. Snapshot-test the rendered overflow menu at 993 px and 1280 px.

## Acceptance

- Behavior described in **Symptom** no longer reproduces.
- A regression test from **Fix plan** is added and passes locally.
- Any spec doc referenced in **Fix plan** is created/updated in the same change.

## Status log

- 2026-06-06 — opened. RCA + fix plan ready. No code changes yet (per user request — fixes deferred).
