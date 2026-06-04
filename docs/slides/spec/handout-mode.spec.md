# Speaker handout export mode

## Goal
Provide a single route, `/slides/handout`, that renders a printable
speaker handout — one page per enabled slide, each page showing the slide
thumbnail at the top and the speaker notes underneath. `Cmd/Ctrl + P →
Save as PDF` from this route MUST produce a PDF whose pages match the
on-screen handout 1:1 at 1920×1080 landscape.

## Contract
1. **Route**: `src/routes/slides.handout.tsx` → URL `/slides/handout`.
2. **Source of truth**: reads the current deck from `useDeck`. Only slides
   where `enabled !== false` are emitted, in deck order.
3. **Page geometry**: shares the global `@page { size: 1920px 1080px
   landscape; margin: 0 }` rule from `src/styles.css`. Each slide is
   wrapped in `.handout-page` with `page-break-after: always`.
4. **Layout per page**:
   - Top region: 1920×720 area that hosts the slide thumbnail via
     `ScaledSlide`/`RenderSlide` (same rendering as `/slides/print`).
   - Bottom region: 1920×360 notes panel showing slide number, slide
     title, and the speaker notes body in monospace-friendly readable
     type. If `slide.notes` is empty, the panel renders a muted
     placeholder (`No speaker notes for this slide.`) so page count
     still matches deck length.
5. **Step-aware slides**: handout emits the FINAL step state of `steps`
   and `timeline` slides via `slideStepCount(slide) - 1` so all reveals
   appear in the printed thumbnail.
6. **Chrome suppression**: the route renders no presenter chrome. A
   `data-print-hide` instruction notice explains the print flow on
   screen but is suppressed in the exported PDF.
7. **Screen preview**: on screen each `.handout-page` shows full viewport
   width with `aspect-ratio: 16/9`, vertically stacked, so the operator
   can scroll the handout before printing. On print, pages snap to exact
   1920×1080.
8. **Entry point**: SettingsDrawer adds an "Export speaker handout" button
   that opens `/slides/handout?auto=1` in a new tab and triggers
   `window.print()` after layout settles (~600ms), mirroring the existing
   "Export deck as PDF" affordance.
9. **No new dependencies.**
10. **Regression test** (`src/routes/slides.handout.test.tsx`): mounts the
    route and asserts one `.handout-page` per enabled slide, each with a
    visible `Slide N` label and either notes text or the placeholder.

## Out of scope
- Multi-up handouts (e.g., 3-up with notes lines).
- Per-slide overrides for page size or layout.
- Hiding notes-empty slides (deferred until a user opts in).
