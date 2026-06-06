# SS-03 — Slide-indicator ellipsis pagination

**Parent:** 06-slide-types-themes-llm-controller
**Slug:** controller-ellipsis
**Status:** pending
**Created:** 2026-06-06

Implements command 06.

## Spec
- Setting: `riseup.controller.ellipsisThreshold` (number, default 15).
- Rendering rule when `total > threshold`:
  - Always show: `1`, `last`, `current-2 … current+2`.
  - Collapse remaining runs into a single `…` glyph (clickable → opens
    `GoToInput` popover focused at the gap's midpoint).
- When `total <= threshold`: render the linear row as today.
- Apply to both:
  - `SlideIndicator` (number pill row in `ControllerPill`).
  - `DotPagination` (bottom-center dots, when enabled in settings).
- Settings drawer: number input bound to the threshold (min 6, max 100).
- Persist across reloads (localStorage).

## New spec doc
Create `spec/old-slides/27-slides-number/03-ellipsis-pagination.md` with:
- Visual example (`1 2 3 … 8 9 [10] 11 12 … 24 25`).
- Edge cases: current near start (no left ellipsis), current near end (no
  right ellipsis), exactly `threshold + 1` total.
- Click-`…` behaviour and keyboard a11y.

## Verification
- Unit test the slot calculator (`buildPaginationSlots(total, current, threshold)`).
- E2E: deck with 25 slides, threshold=15 → DOM contains exactly two `…`.
