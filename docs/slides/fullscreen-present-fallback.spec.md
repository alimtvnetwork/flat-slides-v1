# Fullscreen Present Fallback Spec

## Root cause

The slide app's native fullscreen path works when the deck is opened as a top-level page, but the Lovable preview runs the app inside an editor iframe. Browser fullscreen is controlled by the embedding page: if that iframe is not allowed to fullscreen, or if fullscreen only applies inside the preview frame, the app cannot force itself out into true top-level fullscreen.

The previous code made this worse by swallowing `requestFullscreen()` failures in `useFullscreen.enter()`, so clicking the present/fullscreen control could appear to do nothing.

## Required behavior

1. Keep the existing stable fullscreen root for top-level presentation pages.
2. Detect when the app is embedded in another window.
3. In embedded mode, open the current slide route in a dedicated top-level presenter window instead of attempting an iframe-scoped fullscreen.
4. If popup opening is blocked, show a presenter toast with a clear fallback message.
5. If native fullscreen fails on a top-level page, show a presenter toast instead of failing silently.
6. Preserve existing step-aware slide URLs (`/slides/N/S`) and query params when opening the presenter window.

## Validation target

- Direct `/slides/1`: fullscreen button requests native fullscreen on `[data-slides-fullscreen-root]`.
- Embedded preview: fullscreen button opens a top-level presenter window for the same route.
- Rejected fullscreen request: returns a failure result and surfaces a toast.

## Remaining after this spec

- Add browser-level E2E coverage if Playwright or equivalent is introduced; current project only has Vitest/jsdom tests.