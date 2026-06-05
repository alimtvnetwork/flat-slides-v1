import { AnimatePresence, motion } from "framer-motion";
import { Camera, CameraOff, Circle, Crosshair, FlipHorizontal2, Maximize, PictureInPicture2, RectangleHorizontal, Shapes, Sparkles, X } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import squircleMask from "@/assets/camera-2026/02-squircle-mask-black.png";
import whitePlate from "@/assets/camera-2026/03-squircle-plate-white-shadow.png";
import goldPlate from "@/assets/camera-2026/04-squircle-plate-gold-shadow.png";
import {
  CAMERA_STAGE,
  CAMERA_FREE_MAX_W,
  CAMERA_FREE_MIN_W,
  cameraDimensions,
  clampCameraPosition,
  useChrome,
  type CameraShape,
} from "@/components/slides/chrome-store";
import { getSlidesPortalRoot } from "@/components/slides/fullscreenTarget";
import { useCamera } from "@/components/slides/useCamera";
import { useFullscreen } from "@/components/slides/useFullscreen";
import { useAutoFrame } from "@/components/slides/useAutoFrame";
import { useReducedMotion } from "@/components/slides/useReducedMotion";
import { cn } from "@/lib/utils";

import { CameraPlate } from "./CameraPlate";

const CAMERA_BUTTON_CLASS = "flex h-6 w-6 items-center justify-center rounded-full bg-black/85 text-white shadow-md ring-1 ring-white/35 hover:bg-black hover:ring-white";

const SQUIRCLE_RADIUS = "38% / 34%";
const SHAPE_RADIUS = { circle: "9999px", squircle: SQUIRCLE_RADIUS, rect: "18px" } as const;

function readStageScale() {
  if (typeof document === "undefined") return 1;
  const cssScale = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--stage-scale"));
  if (Number.isFinite(cssScale) && cssScale > 0) return cssScale;
  const stage = document.querySelector<HTMLElement>(".slide-wrapper");
  const rect = stage?.getBoundingClientRect();
  return rect && rect.width > 0 ? rect.width / 1920 : 1;
}

function readStageFrame() {
  if (typeof document === "undefined") return { left: 0, top: 0, scale: 1 };
  const cssFrame = readCssStageFrame();
  if (cssFrame) return cssFrame;
  const stage = document.querySelector<HTMLElement>(".slide-wrapper");
  const rect = stage?.getBoundingClientRect();
  return rect && rect.width > 0 ? { left: rect.left, top: rect.top, scale: rect.width / 1920 } : { left: 0, top: 0, scale: readStageScale() };
}

function readCssStageFrame() {
  const styles = getComputedStyle(document.documentElement);
  const scale = parseFloat(styles.getPropertyValue("--stage-scale"));
  const left = parseCssPx(styles.getPropertyValue("--presenter-frame-left"));
  const top = parseCssPx(styles.getPropertyValue("--presenter-frame-top"));
  if (!Number.isFinite(scale) || !Number.isFinite(left) || !Number.isFinite(top)) return null;
  if (scale <= 0) return null;
  return { left, top, scale };
}

function parseCssPx(value: string) {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function clampToStageFrame(left: number, top: number, width: number, height: number, frame: { left: number; top: number; scale: number }) {
  const frameWidth = CAMERA_STAGE.w * frame.scale;
  const frameHeight = CAMERA_STAGE.h * frame.scale;
  return {
    left: Math.max(frame.left, Math.min(frame.left + frameWidth - width, left)),
    top: Math.max(frame.top, Math.min(frame.top + frameHeight - height, top)),
  };
}

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
  const { status, errorMessage, start, hide, close, attach, togglePiP } = useCamera();
  const { isFs } = useFullscreen();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const shapeFrameRef = useRef<HTMLDivElement | null>(null);
  const firstShapeRef = useRef(true);
  const dragState = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const resizeState = useRef<{ x: number; y: number; width: number; baseX: number; baseY: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [stageFrame, setStageFrame] = useState(() => readStageFrame());
  const reducedMotion = useReducedMotion();
  const autoFrame = useAutoFrame(videoRef, camera.visible && camera.autoFrame && status === "active");
  const stageFill = scene === "stage-fill";

  useEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const update = () => setStageFrame(readStageFrame());
    update();
    const frames = Array.from({ length: 8 }, (_, index) => requestAnimationFrame(() => {
      update();
      if (index === 7 && stageFill) setStageFrame(readStageFrame());
    }));
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    const stage = document.querySelector<HTMLElement>(".slide-wrapper");
    if (stage) ro?.observe(stage);
    window.addEventListener("resize", update);
    document.addEventListener("fullscreenchange", update);
    return () => {
      for (const frame of frames) cancelAnimationFrame(frame);
      window.removeEventListener("resize", update);
      document.removeEventListener("fullscreenchange", update);
      ro?.disconnect();
    };
  }, [isFs, scene, stageFill]);

  // Auto-start whenever the bubble is opened from chrome state.
  useEffect(() => {
    if (camera.visible && (status === "idle" || status === "tray")) void start();
    if (!camera.visible && status === "active") hide();
    if (!camera.visible && status === "requesting") close();
  }, [camera.visible, status, start, hide, close]);

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
        const dims = cameraDimensions(camera);
        if (e.key === "ArrowLeft")  { e.preventDefault(); setCamera(clampCameraPosition({ x: camera.x - step, y: camera.y }, dims)); return; }
        if (e.key === "ArrowRight") { e.preventDefault(); setCamera(clampCameraPosition({ x: camera.x + step, y: camera.y }, dims)); return; }
        if (e.key === "ArrowUp")    { e.preventDefault(); setCamera(clampCameraPosition({ x: camera.x, y: camera.y - step }, dims)); return; }
        if (e.key === "ArrowDown")  { e.preventDefault(); setCamera(clampCameraPosition({ x: camera.x, y: camera.y + step }, dims)); return; }
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        cycleSize();
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        const order = ["S", "M", "L", "XL"] as const;
        const idx = Math.max(0, order.indexOf(camera.size));
        setCamera({ size: order[(idx + order.length - 1) % order.length], customSize: null });
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
  }, [camera, setCamera, cycleSize, cycleShape]);

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

  const dims = cameraDimensions(camera);
  const visualWidth = Math.round((stageFill ? CAMERA_STAGE.w : dims.w) * stageFrame.scale);
  const visualHeight = Math.round((stageFill ? CAMERA_STAGE.h : dims.h) * stageFrame.scale);
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
  const rawAnchor = stageFill
    ? { left: stageFrame.left, top: stageFrame.top }
    : { left: stageFrame.left + camera.x * stageFrame.scale, top: stageFrame.top + camera.y * stageFrame.scale };
  const anchor = clampToStageFrame(rawAnchor.left, rawAnchor.top, visualWidth, visualHeight, stageFrame);
  const anchorStyle: React.CSSProperties = { left: anchor.left, top: anchor.top };

  function onPointerDown(e: React.PointerEvent) {
    if (stageFill) return;
    if ((e.target as HTMLElement).closest("[data-camera-control]")) return;
    if ((e.target as HTMLElement).closest("[data-resize-handle]")) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragState.current = { x: e.clientX, y: e.clientY, ox: camera.x, oy: camera.y };
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = dragState.current;
    if (!d) return;
    const scale = readStageScale();
    const dx = (e.clientX - d.x) / scale;
    const dy = (e.clientY - d.y) / scale;
    setCamera(clampCameraPosition({ x: d.ox + dx, y: d.oy + dy }, dims));
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
    resizeState.current = { x: e.clientX, y: e.clientY, width: dims.w, baseX: camera.x, baseY: camera.y };
  }
  function onResizeMove(e: React.PointerEvent) {
    const r = resizeState.current;
    if (!r) return;
    // Distance from start, signed so the handle "pulls" outward away from the anchor.
    const scale = readStageScale();
    const dx = (e.clientX - r.x) / scale;
    const dy = (e.clientY - r.y) / scale;
    const sign =
      resizeCorner === "br" ? 1
      : resizeCorner === "tl" ? -1
      : resizeCorner === "bl" ? Math.sign(-dx + dy) || 1
      : Math.sign(dx + -dy) || 1;
    const delta = sign * Math.max(Math.abs(dx), Math.abs(dy));
    const next = Math.max(CAMERA_FREE_MIN_W, Math.min(CAMERA_FREE_MAX_W, Math.round(r.width + delta)));
    const nextDims = { w: next, h: Math.round(next * 9 / 16) };
    setCamera(clampCameraPosition({ x: r.baseX, y: r.baseY }, nextDims));
    setCameraCustomSize(next);
  }
  function onResizeUp(e: React.PointerEvent) {
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    resizeState.current = null;
  }

  const node = (
    <motion.div
      data-print-hide="true"
      data-camera-stage-fill={stageFill ? "true" : "false"}
      role="region"
      aria-label="Presenter camera"
      style={{
        position: "fixed",
        zIndex: "var(--z-camera)",
        width: visualWidth,
        height: visualHeight,
        ...anchorStyle,
      }}
      className={cn(
        "group overflow-visible",
        stageFill ? "cursor-default" : "cursor-grab active:cursor-grabbing",
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
          title="Close camera"
          aria-label="Close camera"
          onClick={() => { close(); setCamera({ visible: false }); }}
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
          aria-valuemin={CAMERA_FREE_MIN_W}
          aria-valuemax={CAMERA_FREE_MAX_W}
          aria-valuenow={dims.w}
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
