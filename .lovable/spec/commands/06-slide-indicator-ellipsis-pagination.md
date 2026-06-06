# Command 06 — Slide-number controller: ellipsis pagination when deck is long

**Status:** active
**Created:** 2026-06-06

## Command verbatim
> Usually it would be dot dot dot in between. Only the slide we are in, up to
> two-three close to that, the rest would be dot dot dot, and first and last
> would be visible … more than fifteen … that would be configurable.

## Scope
Applies to the slide-number controller (`SlideIndicator` / number pill row)
shown in the presenter chrome and the dot-pagination row.

## Rule
- When `total <= threshold`, render every number/dot inline (current behaviour).
- When `total > threshold`, render: `1 … (current-2)…(current+2) … last`,
  collapsing the rest into `…` glyphs.
- `threshold` is a user-configurable setting (default **15**) stored under
  `riseup.controller.ellipsisThreshold` in localStorage; exposed in the
  settings drawer.
- Current slide stays visually distinct (gold pill) as today.
- Clicking `…` opens a quick number-jump popover (reuse existing `GoToInput`).

## Files (likely)
- `src/components/slides/controls/SlideIndicator.tsx`
- `src/components/slides/controls/DotPagination.tsx` (if present)
- `src/components/slides/SettingsDrawer.tsx`
- Spec doc: `spec/old-slides/27-slides-number/` — add a new file for ellipsis.

## Reference image
User-provided sample screenshots in `assets/samples/`.
