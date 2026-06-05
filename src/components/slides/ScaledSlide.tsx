import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

type Props = { children: ReactNode; className?: string; fitPadding?: number };
const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;
const SETTLE_FRAMES = 12;

/**
 * Renders children at a fixed 1920x1080 canvas, scaled to fit the parent.
 * Parent must have a non-zero size and `position: relative` (provided here).
 */
export function ScaledSlide({ children, className, fitPadding = 0 }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.1);

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const recompute = () => {
      const rect = readContainerRect(el);
      const { width, height } = rect;
      if (width === 0 || height === 0) return;
      const safeWidth = Math.max(1, width - fitPadding * 2);
      const safeHeight = Math.max(1, height - fitPadding * 2);
      const nextScale = Math.min(safeWidth / CANVAS_WIDTH, safeHeight / CANVAS_HEIGHT);
      setScale(nextScale);
      document.documentElement.style.setProperty("--stage-scale", String(nextScale));
      writePresenterFrameVars(rect, nextScale);
    };
    recompute();
    const frames = scheduleSettledFrames(recompute);
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(recompute);
    ro?.observe(el);
    if (el.parentElement) ro?.observe(el.parentElement);
    window.addEventListener("resize", recompute);
    window.visualViewport?.addEventListener("resize", recompute);
    document.addEventListener("fullscreenchange", recompute);
    return () => {
      for (const frame of frames) cancelAnimationFrame(frame);
      window.removeEventListener("resize", recompute);
      window.visualViewport?.removeEventListener("resize", recompute);
      document.removeEventListener("fullscreenchange", recompute);
      clearPresenterFrameVars();
      ro?.disconnect();
    };
  }, [fitPadding]);

  return (
    <div ref={stageRef} className={`slide-stage ${className ?? ""}`}>
      <div className="slide-wrapper" style={{ ["--scale" as string]: String(scale) }}>
        {children}
      </div>
    </div>
  );
}

type ContainerRect = { width: number; height: number; left: number; top: number };

function readContainerRect(el: HTMLElement): ContainerRect {
  const rect = el.getBoundingClientRect();
  if (rect.width > 0 && rect.height > 0) return rect;
  const parent = el.parentElement?.getBoundingClientRect();
  if (parent && parent.width > 0 && parent.height > 0) return parent;
  const viewport = window.visualViewport;
  return { width: el.clientWidth || viewport?.width || window.innerWidth, height: el.clientHeight || viewport?.height || window.innerHeight, left: 0, top: 0 };
}

function writePresenterFrameVars(rect: ContainerRect, scale: number) {
  const frameWidth = CANVAS_WIDTH * scale;
  const frameHeight = CANVAS_HEIGHT * scale;
  const left = rect.left + Math.max(0, (rect.width - frameWidth) / 2);
  const top = rect.top + Math.max(0, (rect.height - frameHeight) / 2);
  const { width, height } = readViewportSize();
  document.documentElement.style.setProperty("--presenter-frame-left", `${Math.round(left)}px`);
  document.documentElement.style.setProperty("--presenter-frame-top", `${Math.round(top)}px`);
  document.documentElement.style.setProperty("--presenter-frame-right", `${Math.round(Math.max(0, width - left - frameWidth))}px`);
  document.documentElement.style.setProperty("--presenter-frame-bottom", `${Math.round(Math.max(0, height - top - frameHeight))}px`);
}

function readViewportSize() {
  const viewport = window.visualViewport;
  return { width: viewport?.width ?? window.innerWidth, height: viewport?.height ?? window.innerHeight };
}

function clearPresenterFrameVars() {
  for (const name of ["--stage-scale", "--presenter-frame-left", "--presenter-frame-top", "--presenter-frame-right", "--presenter-frame-bottom"]) {
    document.documentElement.style.removeProperty(name);
  }
}

function scheduleSettledFrames(callback: () => void) {
  const frames: number[] = [];
  const tick = (remaining: number) => {
    frames.push(requestAnimationFrame(() => {
      callback();
      if (remaining > 1) tick(remaining - 1);
    }));
  };
  tick(SETTLE_FRAMES);
  return frames;
}
