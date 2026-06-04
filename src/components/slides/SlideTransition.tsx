import { AnimatePresence, motion, type Transition, type Variants } from "motion/react";
import { useEffect, type ReactNode } from "react";

import { triggerWhoosh } from "./audio";
import type { Slide, TransitionKind } from "./types";
import { useReducedMotion } from "./useReducedMotion";

function fadeTransition(): { variants: Variants; transition: Transition } {
  return {
    variants: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit:    { opacity: 0 },
    },
    transition: { duration: 0.3, ease: "easeOut" },
  };
}

function cameraZoomTransition(): { variants: Variants; transition: Transition } {
  return {
    variants: {
      initial: { opacity: 0, scale: 0.92 },
      animate: { opacity: 1, scale: 1 },
      exit:    { opacity: 0, scale: 1.04 },
    },
    transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
  };
}

export function canUseCameraZoom(slide?: Slide): boolean {
  if (!slide) return false;
  if (slide.type === "steps" || slide.type === "timeline") return false;
  return (slide.focus?.length ?? 0) === 0;
}

export function resolveSlideTransition(
  kind: TransitionKind,
  slide: Slide | undefined,
  reduced: boolean,
): { variants: Variants; transition: Transition; willChange: string } {
  if (reduced) return { ...fadeTransition(), transition: { duration: 0.15, ease: "linear" }, willChange: "opacity" };
  if (kind === "camera-zoom" && canUseCameraZoom(slide)) {
    return { ...cameraZoomTransition(), willChange: "opacity, transform" };
  }
  return { ...fadeTransition(), willChange: "opacity" };
}

type Props = { transitionKey: string; transitionKind?: TransitionKind; slide?: Slide; children: ReactNode };

/**
 * Wraps the active slide in a motion transition. The `transitionKey` should
 * change whenever you want a transition. Step changes should keep the same key
 * so timeline/list reveals stay local and never trigger a full-slide zoom.
 */
export function SlideTransition({ transitionKey, transitionKind = "fade", slide, children }: Props) {
  const reduced = useReducedMotion();
  const { variants, transition, willChange } = resolveSlideTransition(transitionKind, slide, reduced);

  useEffect(() => {
    // Whoosh fires on every slide change — `transitionKey` only changes between
    // slides (steps reuse the same key). `triggerWhoosh` itself respects the
    // Settings → Sound mute and the OS reduced-motion flag.
    triggerWhoosh();
  }, [transitionKey]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={transitionKey}
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={transition}
          className="absolute inset-0"
          style={{ willChange }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
