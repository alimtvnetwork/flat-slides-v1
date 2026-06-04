import { type ReactNode } from "react";

import { getActiveFocusRegion, type FocusRegion, type Slide } from "./types";
import { useReducedMotion } from "./useReducedMotion";

interface Props {
  slide?: Slide;
  step?: number;
  children: ReactNode;
}

/**
 * Applies the authored, opt-in focus camera for a slide step. Deck-level
 * transition zoom stays disabled in SlideTransition; this component only frames
 * explicit `slide.focus` rectangles inside the fixed 1920×1080 canvas.
 */
export function CameraStage({ slide, step = 1, children }: Props) {
  const reducedMotion = useReducedMotion();
  const focus = slide ? getActiveFocusRegion(slide, step) : null;
  const frame = focus ? focusTransform(focus) : IDENTITY_FRAME;
  const duration = Math.max(0, Math.min(focus?.duration ?? 700, 1200));

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          transform: frame.transform,
          transformOrigin: "0 0",
          transition: reducedMotion ? "none" : `transform ${duration}ms cubic-bezier(0.22, 1, 0.36, 1)`,
          willChange: "transform",
        }}
      >
        {children}
      </div>
    </div>
  );
}

const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;
const FOCUS_MARGIN = 96;
const MAX_FOCUS_SCALE = 2.4;
const IDENTITY_FRAME = { transform: "translate3d(0px, 0px, 0) scale(1)" };

function focusTransform(region: FocusRegion): { transform: string } {
  const safeWidth = Math.max(1, region.w + FOCUS_MARGIN * 2);
  const safeHeight = Math.max(1, region.h + FOCUS_MARGIN * 2);
  const scale = clamp(Math.min(CANVAS_WIDTH / safeWidth, CANVAS_HEIGHT / safeHeight), 1, MAX_FOCUS_SCALE);
  const centerX = region.x + region.w / 2;
  const centerY = region.y + region.h / 2;
  const minX = CANVAS_WIDTH - CANVAS_WIDTH * scale;
  const minY = CANVAS_HEIGHT - CANVAS_HEIGHT * scale;
  const x = clamp(CANVAS_WIDTH / 2 - centerX * scale, minX, 0);
  const y = clamp(CANVAS_HEIGHT / 2 - centerY * scale, minY, 0);
  return { transform: `translate3d(${round(x)}px, ${round(y)}px, 0) scale(${round(scale)})` };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function round(value: number) {
  return Math.round(value * 1000) / 1000;
}
