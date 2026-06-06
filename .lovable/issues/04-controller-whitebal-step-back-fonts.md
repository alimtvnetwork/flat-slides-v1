# Controller missing white-balance, step-back broken, fonts not anti-aliased

**Status:** open
**Created:** 2026-06-06

## Symptoms
1. The white-balance / brightness slider lives outside the controller pill. User wants it inside the existing settings controller.
2. Stepping backward through multi-step slides (e.g. timeline with 3 steps) does not work — forward advances, back does not return to the previous step before going to the previous slide.
3. Headings/fonts render poorly: not anti-aliased, heading weight not bold as intended, wrong font for headings.

## Expected
- White-balance slider accessible from the controller (popover inside ControllerPill or SettingsDrawer launched from it).
- ArrowLeft / PageUp / `k` decrements step within a stepped slide before moving to the previous slide (symmetrical to forward nav).
- Headings use Ubuntu (display) at the correct weight (700) with `-webkit-font-smoothing: antialiased`, `-moz-osx-font-smoothing: grayscale`, `text-rendering: optimizeLegibility`.

## Likely files
- `src/components/slides/controls/ControllerPill.tsx`
- `src/components/slides/SettingsDrawer.tsx`
- `src/components/slides/SlidePresenterPage.tsx` (keyboard nav / step decrement)
- `src/components/slides/useSlideStep.ts` or wherever step state lives
- `src/styles.css` (font-smoothing, heading weight)
- `src/components/slides/RenderSlide.tsx` (title element weight/font)
