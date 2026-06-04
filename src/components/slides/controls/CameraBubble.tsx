import { AnimatePresence, motion } from "framer-motion";
import { Camera, CameraOff, Circle, Crosshair, FlipHorizontal2, Maximize, PictureInPicture2, RectangleHorizontal, Shapes, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import squircleMask from "@/assets/camera-2026/02-squircle-mask-black.png";
import whitePlate from "@/assets/camera-2026/03-squircle-plate-white-shadow.png";
import goldPlate from "@/assets/camera-2026/04-squircle-plate-gold-shadow.png";
import { useChrome, type CameraShape } from "@/components/slides/chrome-store";
import { getSlidesPortalRoot } from "@/components/slides/fullscreenTarget";
import { useCamera } from "@/components/slides/useCamera";
import { useFullscreen } from "@/components/slides/useFullscreen";
import { useAutoFrame } from "@/components/slides/useAutoFrame";
import { useReducedMotion } from "@/components/slides/useReducedMotion";
import { cn } from "@/lib/utils";

import { CameraPlate } from "./CameraPlate";

const CAMERA_BUTTON_CLASS = "flex h-6 w-6 items-center justify-center rounded-full bg-black/85 text-white shadow-md ring-1 ring-white/35 hover:bg-black hover:ring-white";

// "split" blows the bubble up next to the slide; "stage-fill" takes over the entire viewport.
const SIZES = { sm: 144, md: 200, lg: 280 } as const;
const SCENE_SCALE: Record<string, number> = { normal: 1, split: 1.6, "cam-only": 2.4, "stage-fill": 1 };
const MIN_SIZE = 96;
const MAX_SIZE = 720;
const RECT_ASPECT = 16 / 9;
const SQUIRCLE_RADIUS = "38% / 34%";
const SHAPE_RADIUS = { circle: "9999px", squircle: SQUIRCLE_RADIUS, rect: "18px" } as const;

function ShapeIcon({ shape }: { shape: CameraShape }) {
  if (shape === "circle") return <Circle size={12} />;
  if (shape === "rect") return <RectangleHorizontal size={12} />;
  return <Shapes size={12} />;
}

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
  const shapeFrameRef = useRef<HTMLDivElement | null>(null);
  const firstShapeRef = useRef(true);
  const dragState = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const resizeState = useRef<{ x: number; y: number; size: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const reducedMotion = useReducedMotion();
  const autoFrame = useAutoFrame(videoRef, camera.visible && camera.autoFrame && status === "active");

  useEffect(() => setMounted(true), []);

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
      } else if (e.key === "o" || e.key === "O") {
        e.preventDefault();
        cycleShape();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [camera.visible, camera.offsetX, camera.offsetY, camera.mirror, camera.greenScreen, camera.customSize, camera.size, setCamera, setCameraCustomSize, cycleShape]);

  // Respect "show only in fullscreen" preference.
  // External `P` shortcut dispatched from route handler.
  useEffect(() => {
    if (!camera.visible) return;
    const onPip = () => void togglePiP();
    window.addEventListener("slides:camera-pip", onPip);
    return () => window.removeEventListener("slides:camera-pip", onPip);
  }, [camera.visible, togglePiP]);

  useEffect(() => {
    if (firstShapeRef.current) {
      firstShapeRef.current = false;
      return;
    }
    const animate = shapeFrameRef.current?.animate;
    if (reducedMotion || typeof animate !== "function") return;
    animate.call(shapeFrameRef.current,
      [
        { opacity: 0.86, filter: "drop-shadow(0 18px 34px rgb(0 0 0 / 0.45))" },
        { opacity: 1, filter: "drop-shadow(0 18px 44px rgb(0 0 0 / 0.55))", offset: 0.55 },
        { opacity: 1, filter: "drop-shadow(0 18px 34px rgb(0 0 0 / 0.45))" },
      ],
      { duration: 220, easing: "ease-out" },
    );
  }, [camera.shape, reducedMotion]);

  // Respect "show only in fullscreen" preference.
  if (!camera.visible) return null;
  if (camera.fullscreenOnly && !isFs) return null;

  const stageFill = scene === "stage-fill";
  const scale = SCENE_SCALE[scene] ?? 1;
  const baseSize = camera.customSize ?? SIZES[camera.size];
  const size = Math.max(MIN_SIZE, Math.min(MAX_SIZE, Math.round(baseSize * scale)));
  const shapeAspect = camera.shape === "circle" ? 1 : camera.shape === "squircle" ? 772 / 480 : RECT_ASPECT;
  const visualWidth = Math.round(size * shapeAspect);
  const visualHeight = size;
  const radius = stageFill ? "0px" : SHAPE_RADIUS[camera.shape];
  const platePad = Math.round(Math.min(visualWidth, visualHeight) * 0.07);
  const showPlate = !stageFill && camera.shape === "squircle";
  const shapeStyle: React.CSSProperties = {
    borderRadius: radius,
    backgroundColor: camera.backgroundColor,
    backgroundImage: camera.backgroundMode === "image" && camera.backgroundImage ? `url(${camera.backgroundImage})` : undefined,
    backgroundSize: "cover",
    backgroundPosition: "center",
    ...(camera.shape === "squircle"
      ? {
          WebkitMaskImage: `url(${squircleMask})`,
          maskImage: `url(${squircleMask})`,
          WebkitMaskSize: "100% 100%",
          maskSize: "100% 100%",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
        }
      : {}),
  };
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
        zIndex: "var(--z-camera)",
        ...(stageFill
          ? {}
          : { width: visualWidth, height: visualHeight }),
        ...anchorStyle,
      }}
      className={cn(
        "group cursor-grab overflow-visible active:cursor-grabbing",
        !stageFill && "drop-shadow-2xl",
      )}
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.16, ease: "easeOut" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {showPlate && (
        <>
          <img
            src={whitePlate}
            alt=""
            aria-hidden
            draggable={false}
            data-camera-plate="white"
            style={{ left: -platePad, top: -platePad, width: visualWidth + platePad * 2, height: visualHeight + platePad * 2 }}
            className="pointer-events-none absolute z-0 select-none opacity-90"
          />
          <img
            src={goldPlate}
            alt=""
            aria-hidden
            draggable={false}
            data-camera-plate="gold"
            style={{ left: -platePad, top: -platePad, width: visualWidth + platePad * 2, height: visualHeight + platePad * 2 }}
            className="pointer-events-none absolute z-[1] select-none"
          />
        </>
      )}

      <div
        ref={shapeFrameRef}
        data-camera-shape={camera.shape}
        style={shapeStyle}
        className={cn(
          "absolute inset-0 z-[2] overflow-hidden border-2 backdrop-blur",
          "border-white/15 shadow-2xl",
          camera.shape === "squircle" && "border-transparent",
        )}
      >
        <video
          ref={(el) => { videoRef.current = el; attach(el); }}
          autoPlay
          muted
          playsInline
          style={autoFrame.active ? { objectPosition: autoFrame.objectPosition } : undefined}
          className={cn(
            "h-full w-full object-cover opacity-0 transition-opacity",
            status === "active" && "opacity-100 transition-[object-position,opacity] duration-300",
            camera.mirror && "scale-x-[-1]",
            // Cheap chroma-key stand-in: brightens & subtracts green via blend.
            camera.greenScreen && "mix-blend-screen contrast-125 saturate-150",
          )}
        />

        {stageFill && <CameraPlate variant="stage" />}

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
        </div>

      <div className="absolute right-2 top-2 z-20 flex gap-1 opacity-100">
        <button
          data-camera-control
          type="button"
          title="Mirror"
          aria-label="Toggle mirror"
          onClick={() => setCamera({ mirror: !camera.mirror })}
          className={CAMERA_BUTTON_CLASS}
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
            CAMERA_BUTTON_CLASS,
            camera.greenScreen && "text-emerald-300",
          )}
        >
          <Sparkles size={12} />
        </button>
        {autoFrame.supported && (
          <button
            data-camera-control
            type="button"
            title={camera.autoFrame ? "Auto-frame: ON (face tracking)" : "Auto-frame: OFF"}
            aria-label="Toggle auto-frame face tracking"
            aria-pressed={camera.autoFrame}
            onClick={() => setCamera({ autoFrame: !camera.autoFrame })}
            className={cn(
              CAMERA_BUTTON_CLASS,
              camera.autoFrame && "text-sky-300",
            )}
          >
            <Crosshair size={12} />
          </button>
        )}
        <button
          data-camera-control
          type="button"
          title="Cycle size (Shift+C)"
          aria-label="Cycle camera size"
          onClick={cycleSize}
          className={CAMERA_BUTTON_CLASS}
        >
          <Maximize size={12} />
        </button>
        <button
          data-camera-control
          type="button"
          title={`Shape: ${camera.shape} (click to cycle)`}
          aria-label="Cycle camera shape"
          onClick={cycleShape}
          className={CAMERA_BUTTON_CLASS}
        >
          <ShapeIcon shape={camera.shape} />
        </button>
        <button
          data-camera-control
          type="button"
          title="Picture-in-picture"
          aria-label="Picture in picture"
          onClick={() => void togglePiP()}
          className={CAMERA_BUTTON_CLASS}
        >
          <PictureInPicture2 size={12} />
        </button>
        <button
          data-camera-control
          type="button"
          title="Move to next corner"
          aria-label="Move camera to next corner"
          onClick={cycleAnchor}
          className={CAMERA_BUTTON_CLASS}
        >
          <Camera size={12} />
        </button>
        <button
          data-camera-control
          type="button"
          title="Hide"
          aria-label="Hide camera"
          onClick={() => setCamera({ visible: false })}
          className={CAMERA_BUTTON_CLASS}
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
          className="z-20 rounded-sm bg-white/40 ring-1 ring-black/30 hover:bg-white/80"
        />
      )}
    </motion.div>
  );

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>{node}</AnimatePresence>,
    getSlidesPortalRoot() ?? document.body,
  );
}
