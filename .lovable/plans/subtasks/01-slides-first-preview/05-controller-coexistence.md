# Subtask 05 — Controller / launcher coexistence

**Parent:** 01-slides-first-preview
**Slug:** controller-coexistence
**Status:** pending
**Created:** 2026-06-06

## Problem

Controller pill (4 anchors via `riseup.controller.anchor`, `B` cycles)
and the new launcher both want screen real-estate on `/`. They must
not overlap and must not trap focus.

## Resolution rules (draft — confirm during Step 11)

- On `/` only: controller pill defaults to `top-right` anchor; launcher
  owns `bottom-center`. User can still cycle controller anchors with
  `B`, but `bottom-center` is skipped while on `/`.
- On any other `/slides/...` route: behavior unchanged.
- Keymap: `B` cycle skip-list is sourced from a per-route allowlist in
  `presenterActions.ts`; the parity test is updated to assert the
  skip-list.
- Overflow (<1280px): launcher buttons collapse to a horizontal scroll;
  controller pill follows existing overflow-menu rules. No new shortcut
  conflicts (verified by parity test).
