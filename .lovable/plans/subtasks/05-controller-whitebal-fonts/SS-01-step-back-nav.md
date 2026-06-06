# SS-01 — Fix step-back navigation for multi-step slides

**Parent:** 05-controller-whitebal-fonts
**Slug:** step-back-nav
**Status:** pending
**Created:** 2026-06-06

## Goal
ArrowLeft / PageUp / `k` / swipe-back must decrement the current step inside a stepped slide (timeline, steps) before navigating to the previous slide. Currently only forward stepping works; back jumps straight to the previous slide.

## Investigation
- Read `src/components/slides/SlidePresenterPage.tsx` keyboard handler and any `goPrev` / `goNext` helpers.
- Read `slideStepCount` usage and the step state hook (likely `useSlideStep` or URL param `/$slideId/$step`).
- Confirm forward path: increments step until `step === stepCount - 1`, then advances slide index. Mirror that for back.

## Implementation
1. In the prev handler:
   - If `currentStep > 0` → set step to `currentStep - 1` (update URL `/slides/N/S`).
   - Else → navigate to previous slide AND set step to that slide's last step (`slideStepCount(prevSlide) - 1`) so user lands on the final step of the previous slide.
2. Apply the same logic to swipe / button / shortcut paths — route through a single `goPrevStep()` helper.
3. Ensure URL builder uses 1-based slide number and 0-based step (matches existing contract in memory).

## Verification
- Open `/slides/3/0` on a 3-step slide; press ArrowLeft → URL becomes `/slides/2/<lastStep>`.
- On `/slides/3/2` press ArrowLeft → URL `/slides/3/1`, then `/slides/3/0`, then `/slides/2/<lastStep>`.
- Forward nav still works identically.
