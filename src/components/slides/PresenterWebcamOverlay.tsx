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
import { useAutoFrame } from "./useAutoFrame";
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
    show,
    hide,
    close,
    toggleMinimized,
    enterFullscreen,
    exitFullscreen,
    restoreFromOverlay,
    toggleStage,
    toggleHalo,
    toggleCircle,
    runCinematicCycle,
    pushFullscreenAction,
    emitPassthrough,
    autoFrame,
  } = usePresenterWebcam();

  // ─── Step 9 — core keydown listener (spec 03 §2) ────────────────────────
  // Single-press, no modifier, ignored while a text input is focused.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (
        t?.tagName === "INPUT" ||
        t?.tagName === "TEXTAREA" ||
        t?.isContentEditable
      ) {
        return;
      }
      const key = e.key;
      const phase = state.phase;

      if (key === "Escape") {
        if (phase === "fullscreen" || phase === "stage") {
          e.preventDefault();
          exitFullscreen();
          if (phase === "stage") restoreFromOverlay();
        }
        return;
      }

      // Let nav keys fall through to the capture-phase passthrough handler.
      if (
        (phase === "fullscreen" || phase === "stage") &&
        ["ArrowRight", "ArrowDown", "Enter", " ", "PageDown", "ArrowLeft", "PageUp"].includes(key)
      ) {
        return;
      }

      if (key === "i" || key === "I") {
        e.preventDefault();
        if (phase === "on" || phase === "tray" || phase === "stage") close();
        else if (phase === "fullscreen") {
          exitFullscreen();
          queueMicrotask(() => close());
        } else {
          void show();
        }
        return;
      }
      if (key === "m" || key === "M") {
        if (phase !== "on") return;
        e.preventDefault();
        toggleMinimized();
        return;
      }
      if (key === "+" || key === "=") {
        if (phase !== "on") return;
        e.preventDefault();
        stepSize(1);
        return;
      }
      if (key === "-" || key === "_") {
        if (phase !== "on") return;
        e.preventDefault();
        stepSize(-1);
        return;
      }
      if (key === "h" || key === "H") {
        e.preventDefault();
        toggleHalo();
        return;
      }
      if (key === "1") {
        if (phase !== "on" && phase !== "stage") return;
        e.preventDefault();
        toggleStage();
        return;
      }
      // v5 keys (spec 03 §1 row O/P/[/])
      if (key === "O") {
        e.preventDefault();
        toggleCircle();
        return;
      }
      if (key === "P") {
        e.preventDefault();
        if (phase === "off" || phase === "denied") {
          void show().then(() => enterFullscreen());
        } else {
          enterFullscreen();
        }
        return;
      }
      if (key === "[") {
        if (phase !== "fullscreen") return;
        e.preventDefault();
        exitFullscreen();
        return;
      }
      if (key === "]") {
        e.preventDefault();
        runCinematicCycle();
        return;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    state.phase,
    show,
    close,
    exitFullscreen,
    restoreFromOverlay,
    toggleMinimized,
    stepSize,
    toggleHalo,
    toggleStage,
    toggleCircle,
    enterFullscreen,
    runCinematicCycle,
  ]);

  // ─── Step 10 — fullscreen/stage nav passthrough (spec 02 §6) ───────────
  // Capture-phase listener beats the deck's bubble-phase listener so nav keys
  // reach the deck via `riseup:webcam-passthrough` instead of advancing twice.
  useEffect(() => {
    if (state.phase !== "fullscreen" && state.phase !== "stage") return;
    const onCaptureKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const forward = ["ArrowRight", "ArrowDown", "Enter", " ", "PageDown"].includes(e.key);
      const back = ["ArrowLeft", "PageUp"].includes(e.key);
      if (!forward && !back) return;
      e.preventDefault();
      e.stopPropagation();
      if (forward) {
        pushFullscreenAction("goNext");
        emitPassthrough("next");
      } else {
        // Back inside fullscreen first undoes the entry if that was the last action.
        const last = (window as unknown as { __riseupWebcamLastAction?: string }).__riseupWebcamLastAction;
        if (state.phase === "fullscreen" && last === "enter-fullscreen") {
          exitFullscreen();
        } else {
          pushFullscreenAction("goPrev");
          emitPassthrough("prev");
        }
      }
    };
    window.addEventListener("keydown", onCaptureKey, true);
    return () => window.removeEventListener("keydown", onCaptureKey, true);
  }, [state.phase, pushFullscreenAction, emitPassthrough, exitFullscreen]);

  const floatingVideoRef = useRef<HTMLVideoElement | null>(null);
  const fullscreenVideoRef = useRef<HTMLVideoElement | null>(null);
  const dragRef = useRef<DragRef | null>(null);
  const resizeRef = useRef<ResizeRef | null>(null);
  const [dragging, setDragging] = useState(false);

  // Spec 04 — auto-frame: track the largest face per video element and bias
  // object-position toward the face center. No-op without window.FaceDetector.
  const floatingAutoFrame = useAutoFrame(floatingVideoRef, autoFrame);
  const fullscreenAutoFrame = useAutoFrame(fullscreenVideoRef, autoFrame);

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

  // Step 8 — fullscreen surface (spec 02 §1): fixed-position layer over the
  // deck stage with minimal chrome. Key passthrough wiring lands in Phase C.
  if (state.phase === "fullscreen") {
    return (
      <div
        role="region"
        aria-label="Presenter camera (fullscreen)"
        data-testid="presenter-webcam-fullscreen"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 60,
          background: "hsl(var(--background))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <video
          ref={(node) => {
            fullscreenVideoRef.current = node;
            attachStreamToVideo(node);
          }}
          muted
          playsInline
          autoPlay
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: fullscreenAutoFrame.objectPosition,
            transform: "scaleX(-1)",
          }}
        />
        <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 6 }}>
          <ChromeBtn label="Exit fullscreen" onClick={exitFullscreen}>×</ChromeBtn>
        </div>
      </div>
    );
  }

  // Step 8 — stage surface (spec 02 §1): absolute layer covering the full
  // 1920×1080 stage (parent is the scaled slide).
  if (state.phase === "stage") {
    return (
      <div
        role="region"
        aria-label="Presenter camera (stage)"
        data-testid="presenter-webcam-stage"
        style={{
          position: "absolute",
          inset: 0,
          width: 1920,
          height: 1080,
          zIndex: 55,
          background: "hsl(var(--background))",
        }}
      >
        <video
          ref={(node) => {
            fullscreenVideoRef.current = node;
            attachStreamToVideo(node);
          }}
          muted
          playsInline
          autoPlay
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: fullscreenAutoFrame.objectPosition,
            transform: "scaleX(-1)",
          }}
        />
        <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 6 }}>
          <ChromeBtn label="Exit stage" onClick={restoreFromOverlay}>×</ChromeBtn>
        </div>
      </div>
    );
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
            objectPosition: floatingAutoFrame.objectPosition,
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

  // Step 7 — tray surface (spec 02 §5): 40×40 ember-pulse icon parked at the
  // last `on` card's top-right corner. Hover fans out Expand / Fullscreen /
  // Stop. The MediaStream stays alive (state.phase === "tray").
  if (state.phase === "tray") {
    const trayX = position.x + size.w - 40;
    const trayY = position.y;
    return (
      <div
        role="region"
        aria-label="Presenter camera (tray)"
        data-testid="presenter-webcam-tray"
        style={{
          position: "absolute",
          left: trayX,
          top: trayY,
          zIndex: 50,
        }}
      >
        {/* Hidden sink keeps the stream warm while parked. */}
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

        <button
          type="button"
          aria-label="Show camera"
          onClick={() => {
            // No `show()` Promise needed — phase=tray reuses the live stream.
            void (async () => {})();
          }}
          className="cam-tray-pulse group"
          style={{
            position: "relative",
            width: 40,
            height: 40,
            borderRadius: 999,
            border: "none",
            background:
              "radial-gradient(circle at 30% 30%, hsl(var(--gold) / 0.95), hsl(var(--gold) / 0.55) 60%, hsl(var(--background) / 0.85))",
            color: "hsl(var(--background))",
            fontSize: 18,
            cursor: "pointer",
            boxShadow:
              "0 0 0 2px hsl(var(--background) / 0.6), 0 0 24px hsl(var(--gold) / 0.55)",
          }}
        >
          ●
          {/* Hover fan: appears to the left of the puck. */}
          <span
            style={{
              position: "absolute",
              top: "50%",
              right: 48,
              transform: "translateY(-50%)",
              display: "none",
              gap: 6,
              padding: "6px 8px",
              borderRadius: 10,
              background: "hsl(var(--background) / 0.9)",
              boxShadow: "0 8px 24px hsl(var(--background) / 0.6)",
            }}
            className="cam-tray-fan"
          >
            <FanBtn label="Expand" onClick={(e) => { e.stopPropagation(); void show(); }}>
              Expand
            </FanBtn>
            <FanBtn label="Fullscreen" onClick={(e) => { e.stopPropagation(); enterFullscreen(); }}>
              Full
            </FanBtn>
            <FanBtn label="Stop" onClick={(e) => { e.stopPropagation(); close(); }}>
              Stop
            </FanBtn>
          </span>
        </button>
      </div>
    );
  }

  // Steps 8 wires fullscreen + stage surfaces. Keep hidden sinks bound so the
  // stream survives transitions until those surfaces are wired.
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

function FanBtn({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      style={{
        padding: "4px 8px",
        borderRadius: 6,
        border: "none",
        background: "hsl(var(--foreground) / 0.08)",
        color: "hsl(var(--foreground))",
        fontSize: 12,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
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
