import { useLayoutEffect, useRef, type ReactNode } from "react";

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

  useLayoutEffect(() => {
    const el = stageRef.current;
    const frames = new Set<number>();
    if (!el) return;
    const recompute = () => {
      const rect = readContainerRect(el);
      const { width, height } = rect;
      if (width === 0 || height === 0) return;
      const safeWidth = Math.max(1, width - fitPadding * 2);
      const safeHeight = Math.max(1, height - fitPadding * 2);
      const nextScale = Math.min(safeWidth / CANVAS_WIDTH, safeHeight / CANVAS_HEIGHT);
      el.style.setProperty("--stage-scale", String(nextScale));
      if (isPresenterStage(el)) {
        document.documentElement.style.setProperty("--stage-scale", String(nextScale));
        writePresenterFrameVars(rect, nextScale);
      }
    };
    const scheduleRecompute = () => scheduleSettledFrames(recompute, frames);
    recompute();
    scheduleRecompute();
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(recompute);
    ro?.observe(el);
    if (el.parentElement) ro?.observe(el.parentElement);
    window.addEventListener("resize", scheduleRecompute);
    window.visualViewport?.addEventListener("resize", scheduleRecompute);
    document.addEventListener("fullscreenchange", scheduleRecompute);
    return () => {
      for (const frame of frames) cancelAnimationFrame(frame);
      window.removeEventListener("resize", scheduleRecompute);
      window.visualViewport?.removeEventListener("resize", scheduleRecompute);
      document.removeEventListener("fullscreenchange", scheduleRecompute);
      if (isPresenterStage(el)) clearPresenterFrameVars();
      ro?.disconnect();
    };
  }, [fitPadding]);

  return (
    <div ref={stageRef} className={`slide-stage ${className ?? ""}`} style={{ ["--fit-padding" as string]: `${fitPadding}px` }}>
      <div className="slide-wrapper">
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
  const vars = {
    "--stage-scale": String(scale),
    "--presenter-frame-left": `${Math.round(left)}px`,
    "--presenter-frame-top": `${Math.round(top)}px`,
    "--presenter-frame-right": `${Math.round(Math.max(0, width - left - frameWidth))}px`,
    "--presenter-frame-bottom": `${Math.round(Math.max(0, height - top - frameHeight))}px`,
    "--presenter-frame-width": `${Math.round(frameWidth)}px`,
    "--presenter-frame-height": `${Math.round(frameHeight)}px`,
    "--presenter-frame-center-x": `${Math.round(left + frameWidth / 2)}px`,
    "--presenter-frame-center-y": `${Math.round(top + frameHeight / 2)}px`,
  };
  for (const target of presenterVarTargets()) {
    for (const [name, value] of Object.entries(vars)) target.style.setProperty(name, value);
  }
}

function isPresenterStage(el: HTMLElement) {
  return Boolean(el.closest("[data-slide-presenter-root]"));
}

function readViewportSize() {
  const fullscreenRoot = document.querySelector<HTMLElement>("[data-slides-fullscreen-root]");
  if (fullscreenRoot && document.fullscreenElement) {
    const rect = fullscreenRoot.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) return { width: rect.width, height: rect.height };
  }
  const viewport = window.visualViewport;
  return { width: viewport?.width ?? window.innerWidth, height: viewport?.height ?? window.innerHeight };
}

function clearPresenterFrameVars() {
  for (const target of presenterVarTargets()) {
    for (const name of presenterFrameVarNames) target.style.removeProperty(name);
  }
}

const presenterFrameVarNames = [
  "--stage-scale",
  "--presenter-frame-left",
  "--presenter-frame-top",
  "--presenter-frame-right",
  "--presenter-frame-bottom",
  "--presenter-frame-width",
  "--presenter-frame-height",
  "--presenter-frame-center-x",
  "--presenter-frame-center-y",
];

function presenterVarTargets() {
  const targets = [document.documentElement];
  for (const selector of ["[data-slides-fullscreen-root]", "[data-slide-presenter-root]"]) {
    const el = document.querySelector<HTMLElement>(selector);
    if (el && !targets.includes(el)) targets.push(el);
  }
  return targets;
}

function scheduleSettledFrames(callback: () => void, frames: Set<number>) {
  const tick = (remaining: number) => {
    const frame = requestAnimationFrame(() => {
      frames.delete(frame);
      callback();
      if (remaining > 1) tick(remaining - 1);
    });
    frames.add(frame);
  };
  tick(SETTLE_FRAMES);
}
