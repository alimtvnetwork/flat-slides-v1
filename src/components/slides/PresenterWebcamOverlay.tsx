/**
 * PresenterWebcamOverlay
 * ----------------------
 * Spec: spec/old-slides/camera-2026/02-overlay-rendering-and-surfaces.md
 *
 * Step 5 — overlay skeleton + stream binding helper.
 * Step 6 — `on` card surface: draggable header, mirrored <video>, bottom-right
 *          resize handle, chrome (zoom +/-, fullscreen, minimize, close). Drag
 *          and resize math divide pointer deltas by `--stage-scale` (§2).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FREE_MAX_W,
  FREE_MIN_W,
  usePresenterWebcam,
} from "./usePresenterWebcam";

function readStageScale(): number {
  if (typeof document === "undefined") return 1;
  const v = getComputedStyle(document.documentElement).getPropertyValue("--stage-scale");
  const n = parseFloat(v);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

type DragRef = { pointerId: number; startX: number; startY: number; baseX: number; baseY: number };
type ResizeRef = { pointerId: number; startX: number; baseW: number };

export function PresenterWebcamOverlay() {
  const {
    state,
    position,
    size,
    setPosition,
    setFreeSize,
    stepSize,
    hide,
    close,
    toggleMinimized,
    enterFullscreen,
  } = usePresenterWebcam();

  const floatingVideoRef = useRef<HTMLVideoElement | null>(null);
  const fullscreenVideoRef = useRef<HTMLVideoElement | null>(null);
  const dragRef = useRef<DragRef | null>(null);
  const resizeRef = useRef<ResizeRef | null>(null);
  const [dragging, setDragging] = useState(false);

  // Spec 02 §3 — share one MediaStream across multiple <video> nodes.
  const attachStreamToVideo = useCallback(
    (node: HTMLVideoElement | null) => {
      if (!node) return;
      if (state.stream) {
        if (node.srcObject !== state.stream) node.srcObject = state.stream;
        node.play().catch(() => {});
      } else if (node.srcObject) {
        node.srcObject = null;
      }
    },
    [state.stream],
  );

  useEffect(() => {
    for (const v of [floatingVideoRef.current, fullscreenVideoRef.current]) {
      attachStreamToVideo(v);
    }
  }, [attachStreamToVideo]);

  // ─── Drag handlers (header) ───
  const onDragPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      baseX: position.x,
      baseY: position.y,
    };
    setDragging(true);
  };
  const onDragPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId) return;
    const scale = readStageScale();
    setPosition({
      x: d.baseX + (e.clientX - d.startX) / scale,
      y: d.baseY + (e.clientY - d.startY) / scale,
    });
  };
  const onDragPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== e.pointerId) return;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    dragRef.current = null;
    setDragging(false);
  };

  // ─── Resize handlers (bottom-right handle, width-only) ───
  const onResizePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    resizeRef.current = { pointerId: e.pointerId, startX: e.clientX, baseW: size.w };
  };
  const onResizePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = resizeRef.current;
    if (!d || d.pointerId !== e.pointerId) return;
    const scale = readStageScale();
    const nextW = Math.max(
      FREE_MIN_W,
      Math.min(FREE_MAX_W, d.baseW + (e.clientX - d.startX) / scale),
    );
    setFreeSize(nextW);
  };
  const onResizePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (resizeRef.current?.pointerId !== e.pointerId) return;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    resizeRef.current = null;
  };

  if (state.phase === "off" || state.phase === "requesting" || state.phase === "denied") {
    return null;
  }

  // Step 6 — `on` card surface. Subsequent steps add tray / fullscreen / stage.
  if (state.phase === "on") {
    return (
      <div
        role="region"
        aria-label="Presenter camera"
        data-testid="presenter-webcam-on"
        style={{
          position: "absolute",
          left: position.x,
          top: position.y,
          width: size.w,
          height: size.h,
          zIndex: 50,
          borderRadius: 16,
          overflow: "hidden",
          background: "hsl(var(--background))",
          boxShadow:
            "0 0 32px hsl(var(--gold) / 0.18), 0 12px 32px hsl(var(--background) / 0.6)",
          userSelect: "none",
          touchAction: "none",
        }}
      >
        <video
          ref={(node) => {
            floatingVideoRef.current = node;
            attachStreamToVideo(node);
          }}
          muted
          playsInline
          autoPlay
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: "scaleX(-1)", // mirrored selfie view
            display: "block",
          }}
        />

        {/* Drag header (top strip) */}
        <div
          onPointerDown={onDragPointerDown}
          onPointerMove={onDragPointerMove}
          onPointerUp={onDragPointerUp}
          onPointerCancel={onDragPointerUp}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 28,
            cursor: dragging ? "grabbing" : "grab",
            background:
              "linear-gradient(180deg, hsl(var(--background) / 0.55), transparent)",
          }}
          aria-label="Drag camera"
        />

        {/* Chrome row (top-right) */}
        <div
          style={{
            position: "absolute",
            top: 4,
            right: 4,
            display: "flex",
            gap: 4,
            zIndex: 2,
          }}
        >
          <ChromeBtn label="Shrink" onClick={() => stepSize(-1)}>−</ChromeBtn>
          <ChromeBtn label="Grow" onClick={() => stepSize(1)}>+</ChromeBtn>
          <ChromeBtn label="Fullscreen" onClick={enterFullscreen}>⛶</ChromeBtn>
          <ChromeBtn label="Minimize" onClick={toggleMinimized}>–</ChromeBtn>
          <ChromeBtn label="Hide to tray" onClick={hide}>▾</ChromeBtn>
          <ChromeBtn label="Stop camera" onClick={close}>×</ChromeBtn>
        </div>

        {/* Bottom-right resize handle */}
        <div
          role="slider"
          aria-label="Resize camera"
          aria-valuemin={FREE_MIN_W}
          aria-valuemax={FREE_MAX_W}
          aria-valuenow={Math.round(size.w)}
          onPointerDown={onResizePointerDown}
          onPointerMove={onResizePointerMove}
          onPointerUp={onResizePointerUp}
          onPointerCancel={onResizePointerUp}
          style={{
            position: "absolute",
            right: 0,
            bottom: 0,
            width: 18,
            height: 18,
            cursor: "nwse-resize",
            background:
              "linear-gradient(135deg, transparent 50%, hsl(var(--gold) / 0.85) 50%)",
            zIndex: 2,
          }}
        />
      </div>
    );
  }

  // Steps 7–8 wire tray / fullscreen / stage. For now mount the hidden video
  // sinks so the stream stays bound when transitioning through these phases.
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

function ChromeBtn({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      style={{
        width: 22,
        height: 22,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 6,
        border: "none",
        background: "hsl(var(--background) / 0.7)",
        color: "hsl(var(--foreground))",
        fontSize: 14,
        lineHeight: 1,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

export default PresenterWebcamOverlay;
