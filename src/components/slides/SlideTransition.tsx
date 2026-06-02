import { AnimatePresence, motion, type Transition, type Variants } from "motion/react";
import { useEffect, type ReactNode } from "react";

import { triggerWhoosh } from "./audio";
import type { TransitionKind } from "./types";
import { useReducedMotion } from "./useReducedMotion";

function variantsFor(kind: TransitionKind): { variants: Variants; transition: Transition } {
  switch (kind) {
    case "camera-zoom":
    case "morph":
    case "eaten":
    case "fade":
    default:
      return {
        variants: {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          exit:    { opacity: 0, y: -12 },
        },
        transition: { duration: 0.3, ease: "easeOut" },
      };
  }
}

type Props = { transitionKey: string; children: ReactNode };

/**
 * Wraps the active slide in a motion transition. The `transitionKey` should
 * change whenever you want a transition. Step changes should keep the same key
 * so timeline/list reveals stay local and never trigger a full-slide zoom.
 */
export function SlideTransition({ transitionKey, children }: Props) {
  const reduced = useReducedMotion();
  // Zoom-style transitions are disabled globally: every authored transition now resolves to fade.
  const effectiveKind: TransitionKind = "fade";
  const { variants, transition } = variantsFor(effectiveKind);
  const tx: Transition = reduced ? { duration: 0.05, ease: "linear" } : transition;

  useEffect(() => {
    // Whoosh fires on every slide change — `transitionKey` only changes between
    // slides (steps reuse the same key). `triggerWhoosh` itself respects the
    // Settings → Sound mute and the OS reduced-motion flag.
    triggerWhoosh();
  }, [transitionKey]);

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ perspective: "var(--slide-perspective)", transformStyle: "preserve-3d" }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={transitionKey}
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={tx}
          className="absolute inset-0"
          style={{ transformStyle: "preserve-3d", willChange: "transform, opacity, filter" }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
