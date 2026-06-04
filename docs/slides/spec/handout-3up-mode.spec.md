# 3-up speaker handout export mode

## Goal
Provide a compact printable route, `/slides/handout-3up`, for speaker handouts that place up to three enabled slides on each 1920×1080 landscape PDF page. Each row shows a rendered slide thumbnail and a notes area so presenters can review more of the deck per printed page.

## Contract
1. **Route**: `src/routes/slides.handout-3up.tsx` → URL `/slides/handout-3up`.
2. **Source of truth**: reads the current deck from `useDeck`. Only slides where `enabled !== false` are emitted, in deck order.
3. **Pagination**: enabled slides are chunked into groups of three. Each group renders exactly one `.handout-threeup-page`.
4. **Page geometry**: shares `@page { size: 1920px 1080px landscape; margin: 0 }`. On screen each page is a 16:9 preview; on print it snaps to exactly 1920×1080.
5. **Row layout**: each printed page has three equal rows. Every populated row contains:
   - left: slide thumbnail rendered through `ScaledSlide` + `RenderSlide`;
   - right: slide number, title, speaker notes, and faint ruled writing lines.
6. **Short final page**: if the final chunk has one or two slides, render empty `.handout-threeup-row.is-empty` placeholders so page geometry remains stable.
7. **Step-aware slides**: thumbnails render the final reveal state via `slideStepCount(slide) - 1` for `steps` and `timeline` slides.
8. **Chrome suppression**: a `data-print-hide` notice explains the print flow on screen and is suppressed in the exported PDF.
9. **Entry point**: SettingsDrawer exposes “Export 3-up handout”, opening `/slides/handout-3up?auto=1` in a new tab and triggering `window.print()` after layout settles.
10. **Regression test**: `src/routes/slides.handout-3up.test.tsx` asserts page chunking, exactly three rows per page, slide labels, and hidden print instructions.

## Out of scope
- Editing speaker notes from the export page.
- Configurable rows-per-page.
- Hiding slides without speaker notes.