# RCA: Present/F fullscreen appears broken in preview

## What is wrong today

The deck is visible first, but the Present flow still tries native fullscreen before handling the Lovable preview iframe case. In an embedded preview this can either be blocked or fullscreen only the iframe, so the user experiences Present/F as doing nothing useful.

The fullscreen controller also disappears after entering fullscreen because `SlidePresenterPage` only renders `ControllerPill` when `!isFs`. That removes the visible fullscreen/minimize control at exactly the moment the presenter needs it.

## Files implicated

- `src/components/slides/useFullscreen.ts` — embedded preview fallback is not first-class.
- `src/components/slides/SlidePresenterPage.tsx` — controller is hidden in fullscreen.
- `src/components/slides/fullscreenTarget.test.ts` — tests currently encode the wrong embedded-first behavior.

## Failed prior decision

Earlier code optimized for native fullscreen first, then popup fallback. The actual product requirement is preview-safe presentation: embedded preview must open a top-level presenter window immediately, while direct slide routes use native fullscreen.