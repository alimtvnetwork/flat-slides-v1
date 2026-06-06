# 005 — Camera bubble does not appear even when “Show camera” is enabled

**Status:** in-progress (mount landed; permission-denied toast + fullscreen-only handling still pending)
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
