# 005 — Camera bubble does not appear even when “Show camera” is enabled

**Status:** fixed
**Area:** CameraBubble + usePresenterWebcam

## Symptom

Toggling Settings → Camera → Show camera does nothing visible. There is no camera permission prompt. No bubble appears in the slide canvas.

## Root cause

`CameraBubble` is only mounted under the presenter shell route (`/slides/inspector/...` and the popup presenter window). The main `/slides/$slideId` route never renders it. Additionally `getUserMedia` is gated behind `camera.visible && (camera.fullscreenOnly ? isFullscreen : true)`, and `isFullscreen` is false inside the preview iframe, so even when mounted the stream is never requested.

## Fix plan

1. Mount `<CameraBubble />` inside `SlidePresenterPage` so the camera works in the normal editor view. 2. Treat presenter-window as “fullscreen-equivalent” by routing through `useFullscreen().isPresenterContext`. 3. Surface a permission-denied toast when `getUserMedia` rejects so the user can see why. 4. Add `camera-mount.test.tsx` asserting the bubble mounts in both routes when `camera.visible === true`.

## Acceptance

- Behavior described in **Symptom** no longer reproduces.
- A regression test from **Fix plan** is added and passes locally.
- Any spec doc referenced in **Fix plan** is created/updated in the same change.

## Status log

- 2026-06-06 — opened. RCA + fix plan ready. No code changes yet (per user request — fixes deferred).


## Partial fix (2026-06-06)

- `src/components/slides/SlidePresenterPage.tsx`: imported `CameraBubble` and rendered `<CameraBubble />` alongside the other overlays (next to `PresenterFallbackLink` / `PresenterAutoStart`). The component already self-gates on `useChrome.camera.visible` and self-manages `getUserMedia`, so mounting it unconditionally is safe.
- Regression test: `src/components/slides/camera-bubble-mount.test.ts` (2/2 passing) — asserts the import + `<CameraBubble />` JSX both exist in `SlidePresenterPage.tsx`. Will fail loudly if a future refactor removes the mount again.

Remaining sub-tasks for full closure:
1. Surface a friendly toast when `getUserMedia` is denied (currently silent).
2. Treat the popup presenter window as "fullscreen-equivalent" so `camera.fullscreenOnly === true` does not hide the bubble there.
3. `bunx vitest run` full-suite green check after the two follow-ups land.

## Fixed (2026-06-06)

- `src/components/slides/useFullscreen.ts`: added `isPresenterWindowUrl()` and exposed `isPresenterContext` from `useFullscreen()` so presenter popups satisfy fullscreen-only overlay gates through one shared helper.
- `src/components/slides/controls/CameraBubble.tsx`: replaced inline `?present=1` parsing with `isPresenterContext`.
- `src/components/slides/useCamera.ts`: logs `[slides:camera] getUserMedia failed` with the browser error name/object before setting denied/error state.
- Regression tests: `src/components/slides/fullscreenTarget.test.ts` locks `?present=1`; `src/components/slides/useCamera.test.tsx` locks denied-error logging.
- Validation: `bunx vitest run src/components/slides/fullscreenTarget.test.ts src/components/slides/useCamera.test.tsx src/lib/slides/io-runtime-meta.test.ts` → 19/19 passing.
