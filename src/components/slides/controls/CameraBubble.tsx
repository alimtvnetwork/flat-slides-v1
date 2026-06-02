import { AnimatePresence, motion } from "framer-motion";
import { Camera, CameraOff, FlipHorizontal2, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import { useChrome } from "@/components/slides/chrome-store";
import { useCamera } from "@/components/slides/useCamera";
import { cn } from "@/lib/utils";

const SIZES = { sm: 144, md: 200, lg: 280 } as const;

/**
 * Floating draggable webcam bubble. Anchors to one of 4 corners (persisted)
 * and tracks an offset the presenter can drag. Hidden when chrome.camera.visible
 * is false. Stream lifecycle handled by useCamera — never exported.
 */
export function CameraBubble() {
  const camera = useChrome((s) => s.camera);
  const setCamera = useChrome((s) => s.setCamera);
  const { status, errorMessage, start, stop, attach } = useCamera();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const dragState = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  // Auto-start whenever the bubble is opened from chrome state.
  useEffect(() => {
    if (camera.visible && status === "idle") void start();
    if (!camera.visible && (status === "active" || status === "requesting")) stop();
  }, [camera.visible, status, start, stop]);

  if (!camera.visible) return null;

  const size = SIZES[camera.size];
  const anchorStyle: React.CSSProperties = (() => {
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

  const node = (
    <motion.div
      data-print-hide="true"
      role="region"
      aria-label="Presenter camera"
      style={{ position: "fixed", zIndex: 60, width: size, height: size, ...anchorStyle }}
      className={cn(
        "overflow-hidden rounded-full border-2 shadow-2xl cursor-grab active:cursor-grabbing",
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
          title="Hide"
          aria-label="Hide camera"
          onClick={() => setCamera({ visible: false })}
          className="rounded-full bg-black/70 p-1.5 text-white/90 hover:bg-black/90"
        >
          <X size={12} />
        </button>
      </div>
    </motion.div>
  );

  return createPortal(
    <AnimatePresence>{node}</AnimatePresence>,
    document.body,
  );
}
