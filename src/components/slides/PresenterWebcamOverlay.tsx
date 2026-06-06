/**
 * PresenterWebcamOverlay (Step 5 / spec step 9)
 * ----------------------------------------------
 * The VIEW for the presenter camera. Reads context from
 * `usePresenterWebcam()` and renders exactly one of four surfaces
 * (`on` | `tray` | `fullscreen` | `stage`) based on `state.phase`.
 *
 * This step ships the skeleton + stream-binding helper. Surfaces
 * (steps 6–8) plug into the placeholder branches below.
 *
 * Spec: spec/old-slides/camera-2026/02-overlay-rendering-and-surfaces.md §1, §3.
 */
import { useCallback, useEffect, useRef } from "react";
import { usePresenterWebcam } from "./usePresenterWebcam";

export function PresenterWebcamOverlay() {
  const { state } = usePresenterWebcam();
  const floatingVideoRef = useRef<HTMLVideoElement | null>(null);
  const fullscreenVideoRef = useRef<HTMLVideoElement | null>(null);

  // Spec 02 §3 — the same MediaStream can feed multiple <video> nodes.
  // Never move the stream exclusively; bind to whichever node currently exists.
  const attachStreamToVideo = useCallback(
    (node: HTMLVideoElement | null) => {
      if (!node) return;
      if (state.stream) {
        if (node.srcObject !== state.stream) node.srcObject = state.stream;
        node.play().catch(() => {
          /* autoplay blocked — user gesture already happened */
        });
      } else if (node.srcObject) {
        node.srcObject = null;
      }
    },
    [state.stream],
  );

  // Re-bind on every stream change so floating + fullscreen surfaces stay live.
  useEffect(() => {
    for (const v of [floatingVideoRef.current, fullscreenVideoRef.current]) {
      attachStreamToVideo(v);
    }
  }, [attachStreamToVideo]);

  // Inert phases — controller chip surfaces status instead.
  if (
    state.phase === "off" ||
    state.phase === "requesting" ||
    state.phase === "denied"
  ) {
    return null;
  }

  // Surface placeholders (filled in by Phase B steps 6–8). Render a
  // hidden mounting point for the <video> nodes so stream binding stays
  // valid even before the visible chrome lands.
  return (
    <div data-testid="presenter-webcam-overlay" aria-hidden>
      <video
        ref={(node) => {
          floatingVideoRef.current = node;
          attachStreamToVideo(node);
        }}
        muted
        playsInline
        autoPlay
        style={{ display: "none" }}
      />
      <video
        ref={(node) => {
          fullscreenVideoRef.current = node;
          attachStreamToVideo(node);
        }}
        muted
        playsInline
        autoPlay
        style={{ display: "none" }}
      />
    </div>
  );
}

export default PresenterWebcamOverlay;
