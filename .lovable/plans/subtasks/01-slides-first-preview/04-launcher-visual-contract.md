# Subtask 04 — Launcher visual contract

**Parent:** 01-slides-first-preview
**Slug:** launcher-visual-contract
**Status:** pending
**Created:** 2026-06-06

## Contract (draft — confirm during Step 10)

- Position: bottom-center of viewport on `/` only. Hidden on
  `/slides/$slideId(/$step)` (deck deep links keep the existing
  controller pill alone).
- Z-index: above slide canvas, below SettingsDrawer overlay. Use the
  layer table in `docs/slides/spec/z-index.spec.md`.
- Visibility: always-on on `/` (this is the launcher surface). The
  hover-reveal rule from controller-2026 applies to the controller
  pill, NOT to the launcher.
- Motion: opacity + ≤16px translate on mount; no scale. Consults
  `useReducedMotion()` per project core rule.
- Layout: horizontal row of buttons at ≥1280px; collapses to a
  scrollable strip <1280px (mirrors controller overflow behavior, but
  the launcher itself does not move to a menu).
- Accessibility: each button is a real `<button>` or `<Link>`; focus
  ring uses semantic tokens; tab order = visual order; Escape closes
  any opened SettingsDrawer / Import dialog without leaving `/`.
- Styling: semantic tokens only (`bg-card`, `text-foreground`,
  `border`, `--shadow-elegant`). No custom hex.
