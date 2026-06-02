import { AnimatePresence, motion } from "framer-motion";
import { Camera, CameraOff, FlipHorizontal2, Maximize, PictureInPicture2, Shapes, Sparkles, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import { useChrome } from "@/components/slides/chrome-store";
import { useCamera } from "@/components/slides/useCamera";
import { useFullscreen } from "@/components/slides/useFullscreen";
import { cn } from "@/lib/utils";

// "split" blows the bubble up next to the slide; "stage-fill" takes over the entire viewport.
const SIZES = { sm: 144, md: 200, lg: 280 } as const;
const SCENE_SCALE: Record<string, number> = { normal: 1, split: 1.6, "cam-only": 2.4, "stage-fill": 1 };
const MIN_SIZE = 96;
const MAX_SIZE = 720;
// CSS squircle approximation via border-radius (superellipse-ish).
const SHAPE_RADIUS = {
  circle: "9999px",
  squircle: "32%",
  rect: "12px",
} as const;

/**
 * Floating draggable webcam bubble. Anchors to one of 4 corners (persisted)
 * and tracks an offset the presenter can drag. Hidden when chrome.camera.visible
 * is false. Stream lifecycle handled by useCamera — never exported.
 */
export function CameraBubble() {
  const camera = useChrome((s) => s.camera);
  const setCamera = useChrome((s) => s.setCamera);
  const scene = useChrome((s) => s.scene);
  const cycleSize = useChrome((s) => s.cycleCameraSize);
  const cycleAnchor = useChrome((s) => s.cycleCameraAnchor);
  const cycleShape = useChrome((s) => s.cycleCameraShape);
  const setCameraCustomSize = useChrome((s) => s.setCameraCustomSize);
  const { status, errorMessage, start, stop, attach, togglePiP } = useCamera();
  const { isFs } = useFullscreen();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const dragState = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const resizeState = useRef<{ x: number; y: number; size: number } | null>(null);

  // Auto-start whenever the bubble is opened from chrome state.
  useEffect(() => {
    if (camera.visible && status === "idle") void start();
    if (!camera.visible && (status === "active" || status === "requesting")) stop();
  }, [camera.visible, status, start, stop]);

  // Camera keyboard shortcuts (active only when bubble is visible).
  // - Shift+Arrow: nudge by 16px
  // - "+" / "-": resize by 32px
  // - "M": toggle mirror
  // - "B": toggle background (green-screen blend)
  useEffect(() => {
    if (!camera.visible) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;
      if (e.shiftKey) {
        const step = 16;
        if (e.key === "ArrowLeft")  { e.preventDefault(); setCamera({ offsetX: camera.offsetX - step }); return; }
        if (e.key === "ArrowRight") { e.preventDefault(); setCamera({ offsetX: camera.offsetX + step }); return; }
        if (e.key === "ArrowUp")    { e.preventDefault(); setCamera({ offsetY: camera.offsetY - step }); return; }
        if (e.key === "ArrowDown")  { e.preventDefault(); setCamera({ offsetY: camera.offsetY + step }); return; }
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        const base = camera.customSize ?? SIZES[camera.size];
        setCameraCustomSize(Math.min(MAX_SIZE, base + 32));
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        const base = camera.customSize ?? SIZES[camera.size];
        setCameraCustomSize(Math.max(MIN_SIZE, base - 32));
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        setCamera({ mirror: !camera.mirror });
      } else if (e.key === "b" || e.key === "B") {
        e.preventDefault();
        setCamera({ greenScreen: !camera.greenScreen });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [camera.visible, camera.offsetX, camera.offsetY, camera.mirror, camera.greenScreen, camera.customSize, camera.size, setCamera, setCameraCustomSize]);

  // Respect "show only in fullscreen" preference.
  // External `P` shortcut dispatched from route handler.
  useEffect(() => {
    if (!camera.visible) return;
    const onPip = () => void togglePiP();
    window.addEventListener("slides:camera-pip", onPip);
    return () => window.removeEventListener("slides:camera-pip", onPip);
  }, [camera.visible, togglePiP]);

  // Respect "show only in fullscreen" preference.
  if (!camera.visible) return null;
  if (camera.fullscreenOnly && !isFs) return null;

  const stageFill = scene === "stage-fill";
  const scale = SCENE_SCALE[scene] ?? 1;
  const baseSize = camera.customSize ?? SIZES[camera.size];
  const size = Math.max(MIN_SIZE, Math.min(MAX_SIZE, Math.round(baseSize * scale)));
  const radius =
    stageFill ? "0px" : scene === "cam-only" ? "32px" : SHAPE_RADIUS[camera.shape];
  const anchorStyle: React.CSSProperties = stageFill
    ? { top: 0, left: 0, right: 0, bottom: 0 }
    : (() => {
        const margin = 20;
        switch (camera.anchor) {
          case "top-left":     return { top: margin + camera.offsetY, left: margin + camera.offsetX };
          case "top-right":    return { top: margin + camera.offsetY, right: margin - camera.offsetX };
          case "bottom-left":  return { bottom: margin - camera.offsetY, left: margin + camera.offsetX };
          case "bottom-right":
          default:             return { bottom: margin - camera.offsetY, right: margin - camera.offsetX };
        }
      })();

  function onPointerDown(e: React.PointerEvent) {
    if ((e.target as HTMLElement).closest("[data-camera-control]")) return;
    if ((e.target as HTMLElement).closest("[data-resize-handle]")) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragState.current = { x: e.clientX, y: e.clientY, ox: camera.offsetX, oy: camera.offsetY };
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = dragState.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    setCamera({ offsetX: d.ox + dx, offsetY: d.oy + dy });
  }
  function onPointerUp(e: React.PointerEvent) {
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    dragState.current = null;
  }

  // Resize via opposite-corner handle (relative to anchor) — same-side feels weird.
  const resizeCorner =
    camera.anchor === "top-left" ? "br"
    : camera.anchor === "top-right" ? "bl"
    : camera.anchor === "bottom-left" ? "tr"
    : "tl";
  const resizeStyle: React.CSSProperties = {
    position: "absolute",
    width: 18,
    height: 18,
    cursor: "nwse-resize",
    ...(resizeCorner === "br" ? { right: 4, bottom: 4 } : {}),
    ...(resizeCorner === "bl" ? { left: 4, bottom: 4, cursor: "nesw-resize" } : {}),
    ...(resizeCorner === "tr" ? { right: 4, top: 4, cursor: "nesw-resize" } : {}),
    ...(resizeCorner === "tl" ? { left: 4, top: 4 } : {}),
  };
  function onResizeDown(e: React.PointerEvent) {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    resizeState.current = { x: e.clientX, y: e.clientY, size };
  }
  function onResizeMove(e: React.PointerEvent) {
    const r = resizeState.current;
    if (!r) return;
    // Distance from start, signed so the handle "pulls" outward away from the anchor.
    const dx = e.clientX - r.x;
    const dy = e.clientY - r.y;
    const sign =
      resizeCorner === "br" ? 1
      : resizeCorner === "tl" ? -1
      : resizeCorner === "bl" ? Math.sign(-dx + dy) || 1
      : Math.sign(dx + -dy) || 1;
    const delta = sign * Math.max(Math.abs(dx), Math.abs(dy));
    const nextRaw = Math.round((r.size + delta) / scale);
    const next = Math.max(MIN_SIZE, Math.min(MAX_SIZE, nextRaw));
    setCameraCustomSize(next);
  }
  function onResizeUp(e: React.PointerEvent) {
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    resizeState.current = null;
  }

  const node = (
    <motion.div
      data-print-hide="true"
      role="region"
      aria-label="Presenter camera"
      style={{
        position: "fixed",
        zIndex: 60,
        ...(stageFill
          ? {}
          : { width: size, height: size }),
        borderRadius: radius,
        ...anchorStyle,
      }}
      className={cn(
        "overflow-hidden border-2 shadow-2xl cursor-grab active:cursor-grabbing",
        "border-white/15 bg-black/60 backdrop-blur",
      )}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <video
        ref={(el) => { videoRef.current = el; attach(el); }}
        autoPlay
        muted
        playsInline
        className={cn(
          "h-full w-full object-cover",
          camera.mirror && "scale-x-[-1]",
          // Cheap chroma-key stand-in: brightens & subtracts green via blend.
          camera.greenScreen && "mix-blend-screen contrast-125 saturate-150",
        )}
      />

      {status !== "active" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/70 px-2 text-center text-[11px] text-white">
          {status === "requesting" && (
            <>
              <Camera size={18} className="animate-pulse" />
              <span>Requesting camera…</span>
            </>
          )}
          {status === "denied" && (
            <>
              <CameraOff size={18} />
              <span>Permission denied</span>
              <button
                data-camera-control
                type="button"
                onClick={() => void start()}
                className="mt-1 rounded bg-white/15 px-2 py-0.5 hover:bg-white/25"
              >
                Retry
              </button>
            </>
          )}
          {status === "error" && (
            <>
              <CameraOff size={18} />
              <span className="line-clamp-2">{errorMessage ?? "Camera error"}</span>
            </>
          )}
        </div>
      )}

      <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-100">
        <button
          data-camera-control
          type="button"
          title="Mirror"
          aria-label="Toggle mirror"
          onClick={() => setCamera({ mirror: !camera.mirror })}
          className="rounded-full bg-black/70 p-1.5 text-white/90 hover:bg-black/90"
        >
          <FlipHorizontal2 size={12} />
        </button>
        <button
          data-camera-control
          type="button"
          title="Green-screen"
          aria-label="Toggle green-screen blend"
          aria-pressed={camera.greenScreen}
          onClick={() => setCamera({ greenScreen: !camera.greenScreen })}
          className={cn(
            "rounded-full bg-black/70 p-1.5 text-white/90 hover:bg-black/90",
            camera.greenScreen && "text-emerald-300",
          )}
        >
          <Sparkles size={12} />
        </button>
        <button
          data-camera-control
          type="button"
          title="Cycle size (Shift+C)"
          aria-label="Cycle camera size"
          onClick={cycleSize}
          className="rounded-full bg-black/70 p-1.5 text-white/90 hover:bg-black/90"
        >
          <Maximize size={12} />
        </button>
        <button
          data-camera-control
          type="button"
          title={`Shape: ${camera.shape} (click to cycle)`}
          aria-label="Cycle camera shape"
          onClick={cycleShape}
          className="rounded-full bg-black/70 p-1.5 text-white/90 hover:bg-black/90"
        >
          <Shapes size={12} />
        </button>
        <button
          data-camera-control
          type="button"
          title="Picture-in-picture"
          aria-label="Picture in picture"
          onClick={() => void togglePiP()}
          className="rounded-full bg-black/70 p-1.5 text-white/90 hover:bg-black/90"
        >
          <PictureInPicture2 size={12} />
        </button>
        <button
          data-camera-control
          type="button"
          title="Move to next corner"
          aria-label="Move camera to next corner"
          onClick={cycleAnchor}
          className="rounded-full bg-black/70 p-1.5 text-white/90 hover:bg-black/90"
        >
          <Camera size={12} />
        </button>
        <button
          data-camera-control
          type="button"
          title="Hide"
          aria-label="Hide camera"
          onClick={() => setCamera({ visible: false })}
          className="rounded-full bg-black/70 p-1.5 text-white/90 hover:bg-black/90"
        >
          <X size={12} />
        </button>
      </div>

      {!stageFill && (
        <div
          data-resize-handle
          role="slider"
          aria-label="Resize camera"
          aria-valuemin={MIN_SIZE}
          aria-valuemax={MAX_SIZE}
          aria-valuenow={size}
          title="Drag to resize · double-click to reset"
          onPointerDown={onResizeDown}
          onPointerMove={onResizeMove}
          onPointerUp={onResizeUp}
          onPointerCancel={onResizeUp}
          onDoubleClick={(e) => { e.stopPropagation(); setCameraCustomSize(null); }}
          style={resizeStyle}
          className="rounded-sm bg-white/40 hover:bg-white/80 ring-1 ring-black/30"
        />
      )}
    </motion.div>
  );

  return createPortal(
    <AnimatePresence>{node}</AnimatePresence>,
    document.body,
  );
}
