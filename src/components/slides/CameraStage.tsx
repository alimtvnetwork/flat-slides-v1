import { motion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";

import { getActiveFocusRegion, type Slide } from "./types";

interface Props {
  slide: Slide;
  step: number;
  children: ReactNode;
}

/**
 * CameraStage — animates a per-slide "camera-zoom" into a `FocusRegion` rect.
 *
 * Coordinates are slide-space (1920×1080). The active region's centre maps to
 * the canvas centre and is scaled so the region fills the frame (preserving
 * aspect, choosing the LARGER of x/y scale → the rect's smaller dimension
 * fills the view; the rest letterboxes via overflow:hidden upstream).
 *
 * Respects `prefers-reduced-motion` by snapping instantly.
 */
export function CameraStage({ slide, step, children }: Props) {
  const region = getActiveFocusRegion(slide, step);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);

  // Default = identity (no zoom).
  let scale = 1;
  let originX = 50;
  let originY = 50;

  if (region) {
    const sx = 1920 / region.w;
    const sy = 1080 / region.h;
    scale = Math.min(sx, sy); // fit rect inside frame (no clipping)
    const cx = region.x + region.w / 2;
    const cy = region.y + region.h / 2;
    originX = (cx / 1920) * 100;
    originY = (cy / 1080) * 100;
  }

  const duration = region?.duration ?? 700;

  return (
    <motion.div
      className="absolute inset-0"
      style={{ transformOrigin: `${originX}% ${originY}%`, willChange: "transform" }}
      animate={{ scale }}
      transition={
        reducedMotion
          ? { duration: 0 }
          : { duration: duration / 1000, ease: [0.22, 1, 0.36, 1] }
      }
    >
      {children}
    </motion.div>
  );
}
