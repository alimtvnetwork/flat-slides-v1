import { useEffect, useRef } from "react";
import { usePresenterWebcam } from "@/components/slides/usePresenterWebcam";

/**
 * camera-2026 task 7 — render distinct surfaces for each webcam phase.
 *
 *   `on`         → floating bubble, positioned in 1920×1080 stage coords
 *                  (converted to viewport px via `--stage-scale`).
  *   `tray`       → small reveal chip in the bottom-right of the presenter shell;
 *                  stream stays alive so re-show is instantaneous.
  *   `fullscreen` → layer covering the clipped presenter shell.
 *   `stage`      → fills the slide stage rect (cover crop) so the camera
 *                  becomes the active slide background.
 *   `off | requesting | denied` → nothing rendered here (status surfaces
 *                  belong to the presenter toast / coachmark layer).
 *
 * Each surface gets a stable `role="region"` and an `aria-label` so screen
 * readers can distinguish phases. Subsequent tasks layer drag/resize,
 * halo, plates, and nav passthrough on top of this scaffolding.
 */

const SHARED_VIDEO_STYLE: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
  // Mirror the local preview (presenter-facing). Auto-frame transforms
  // compose on top of this in task 11.
  transform: "scaleX(-1)",
};

function VideoEl({ stream }: { stream: MediaStream | null }) {
  const ref = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (v.srcObject !== stream) v.srcObject = stream;
  }, [stream]);
  return <video ref={ref} autoPlay playsInline muted style={SHARED_VIDEO_STYLE} />;
}

export function PresenterWebcamOverlay() {
  const { state, position, size, show } = usePresenterWebcam();

  if (state.phase === "on") {
    // Floating bubble in stage coordinates. The parent ScaledSlide applies
    // `--stage-scale`; we render in raw stage px so `transform: scale(var())`
    // (set on the ScaledSlide root) maps us to the right viewport size.
    return (
      <div
        role="region"
        aria-label="Presenter camera"
        data-webcam-surface="on"
        style={{
          position: "absolute",
          left: position.x,
          top: position.y,
          width: size.w,
          height: size.h,
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 10px 40px rgba(0,0,0,0.35)",
          zIndex: 40,
          background: "black",
        }}
      >
        <VideoEl stream={state.stream} />
      </div>
    );
  }

  if (state.phase === "tray") {
    // Tray = stream alive, video element kept mounted so `show()` is instant,
    // but visually collapsed to a reveal chip. `hidden` would tear down the
    // <video>, so we keep it mounted off-screen.
    return (
      <>
        <div
          aria-hidden
          style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", opacity: 0 }}
        >
          <VideoEl stream={state.stream} />
        </div>
        <button
          type="button"
          role="region"
          aria-label="Presenter camera (hidden) — click to show"
          data-webcam-surface="tray"
          onClick={() => void show()}
          style={{
            position: "absolute",
            right: 16,
            bottom: 16,
            zIndex: 60,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            borderRadius: 999,
            background: "rgba(20,20,20,0.85)",
            color: "white",
            border: "1px solid rgba(255,255,255,0.15)",
            backdropFilter: "blur(8px)",
            cursor: "pointer",
            font: "500 13px/1 system-ui",
          }}
        >
          <span aria-hidden style={{ width: 8, height: 8, borderRadius: 999, background: "#ef4444" }} />
          Camera hidden
        </button>
      </>
    );
  }

  if (state.phase === "fullscreen") {
    return (
      <div
        role="region"
        aria-label="Presenter camera (fullscreen)"
        data-webcam-surface="fullscreen"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 100,
          background: "black",
        }}
      >
        <VideoEl stream={state.stream} />
      </div>
    );
  }

  if (state.phase === "stage") {
    // Fills the stage rect; the closest positioned ancestor (ScaledSlide
    // wrapper) supplies the 1920×1080 box.
    return (
      <div
        role="region"
        aria-label="Presenter camera (stage)"
        data-webcam-surface="stage"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 30,
          background: "black",
        }}
      >
        <VideoEl stream={state.stream} />
      </div>
    );
  }

  return null;
}
