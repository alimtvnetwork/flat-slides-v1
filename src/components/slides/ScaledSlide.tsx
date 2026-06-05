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
      const { width, height } = readContainerSize(el);
      if (width === 0 || height === 0) return;
      const safeWidth = Math.max(1, width - fitPadding * 2);
      const safeHeight = Math.max(1, height - fitPadding * 2);
      const nextScale = Math.min(safeWidth / CANVAS_WIDTH, safeHeight / CANVAS_HEIGHT);
      setScale(nextScale);
      document.documentElement.style.setProperty("--stage-scale", String(nextScale));
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

function readContainerSize(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  if (rect.width > 0 && rect.height > 0) return rect;
  const parent = el.parentElement?.getBoundingClientRect();
  if (parent && parent.width > 0 && parent.height > 0) return parent;
  const viewport = window.visualViewport;
  return { width: el.clientWidth || viewport?.width || window.innerWidth, height: el.clientHeight || viewport?.height || window.innerHeight };
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
