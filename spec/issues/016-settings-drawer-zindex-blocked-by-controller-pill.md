# 016 — SettingsDrawer can render under the controller pill on some routes

**Status:** open
**Area:** z-index layering

## Symptom

Drawer opens but its right-edge buttons are visually occluded by the controller pill, making the Camera section partially unclickable.

## Root cause

Both surfaces use `z-[200]`. The pill mounts later and wins paint order.

## Fix plan

1. Promote `SettingsDrawer` to `z-[210]`. 2. Document a “chrome layer” scale (z=100 thumbnails, 150 pill, 200 menus, 210 drawer, 250 toast) in `docs/slides/spec/z-index.spec.md`. 3. Add a Playwright visual regression.

## Acceptance

- Behavior described in **Symptom** no longer reproduces.
- A regression test from **Fix plan** is added and passes locally.
- Any spec doc referenced in **Fix plan** is created/updated in the same change.

## Status log

- 2026-06-06 — opened. RCA + fix plan ready. No code changes yet (per user request — fixes deferred).
- 2026-06-06 — fixed. Introduced `--z-drawer: 280` in `src/styles.css` (now above `--z-controller: 260` and `--z-camera: 270`), switched `SettingsDrawer` from `z-[200]` to the token, documented the chrome layer scale in `docs/slides/spec/z-index.spec.md`, and locked it with `src/components/slides/SettingsDrawer.zindex.test.tsx`.
