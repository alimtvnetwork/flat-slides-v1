# Print / PDF export mode

## Goal
Provide a single route, `/slides/print`, that renders the entire deck as a
print-ready document. `Cmd/Ctrl + P → Save as PDF` from this route MUST
produce a PDF whose pages match the on-screen slides 1:1 at 1920×1080,
one slide per page, no presenter chrome.

## Contract
1. **Route**: `src/routes/slides.print.tsx` → URL `/slides/print`.
2. **Source of truth**: reads the current deck from `useDeck`. Only slides
   where `enabled !== false` are emitted.
3. **Page geometry**:
   - `@page { size: 1920px 1080px landscape; margin: 0 }`
   - Each slide is wrapped in `.print-page` with `page-break-after: always`.
4. **Slide rendering**: reuses `RenderSlide` inside `ScaledSlide` so theme,
   background, darken, blur, and per-slide content behave exactly like the
   editor.
5. **Step-aware slides**: print emits the FINAL step state of `steps` and
   `timeline` slides (so all reveals are visible in the handout).
6. **Chrome suppression**: every existing presenter chrome element already
   carries `data-print-hide`; this route adds no new chrome. The screen
   view also omits toolbar, sidebar, and notes panel.
7. **Screen preview**: on screen, each `.print-page` shows at 100% viewport
   width with `aspect-ratio: 16/9` so reviewers can scroll the deck before
   printing. On print, the container snaps to exact 1920×1080.
8. **Entry point**: SettingsDrawer's "Export deck as PDF" button opens
   `/slides/print` in a new tab and triggers `window.print()` after load.
9. **Print instruction notice**: the print route shows a small fixed notice
   outside the slide pages explaining that the print dialog will open
   automatically for `?auto=1`, or that the user can press `Cmd/Ctrl + P`
   and choose **Save as PDF**. The notice MUST carry `data-print-hide` and be
   hidden by print CSS so it never appears in exported pages.
10. **No new dependencies.**

## Out of scope
- Speaker-notes handout layout (separate spec, future).
- Per-slide overrides for page size.
