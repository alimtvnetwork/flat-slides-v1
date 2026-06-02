import { AnimatePresence, motion, type Transition, type Variants } from "motion/react";
import { useEffect, type ReactNode } from "react";

import { triggerWhoosh } from "./audio";
import { useDeck } from "./store";
import type { TransitionKind } from "./types";
import { useReducedMotion } from "./useReducedMotion";

function variantsFor(kind: TransitionKind): { variants: Variants; transition: Transition } {
  switch (kind) {
    case "camera-zoom":
      return {
        variants: {
          initial: { opacity: 0, scale: 0.78, z: -600, rotateX: 6, filter: "blur(8px)" },
          animate: { opacity: 1, scale: 1, z: 0, rotateX: 0, filter: "blur(0px)" },
          exit:    { opacity: 0, scale: 1.18, z: 200,  rotateX: -2, filter: "blur(10px)" },
        },
        transition: { duration: 0.72, ease: [0.16, 1, 0.3, 1] },
      };
    case "morph":
      return {
        variants: {
          initial: { opacity: 0, scale: 1.04 },
          animate: { opacity: 1, scale: 1 },
          exit:    { opacity: 0, scale: 0.97 },
        },
        transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] },
      };
    case "eaten":
      return {
        variants: {
          initial: { opacity: 0, scale: 1.06, filter: "blur(4px)" },
          animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
          exit:    { opacity: 0, scale: 0.6, filter: "blur(14px)", x: -120 },
        },
        transition: { duration: 0.4, ease: [0.7, 0, 0.84, 0] },
      };
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

type Props = { transitionKey: string; allowZoom?: boolean; children: ReactNode };

/**
 * Wraps the active slide in a motion transition. The `transitionKey` should
 * change whenever you want a transition. Step changes should keep the same key
 * so timeline/list reveals stay local and never trigger a full-slide zoom.
 */
export function SlideTransition({ transitionKey, allowZoom = false, children }: Props) {
  const kind = useDeck((s) => s.deck.settings.transition);
  const reduced = useReducedMotion();
  // Reduced motion: collapse to a near-instant opacity swap regardless of authored kind.
  const effectiveKind: TransitionKind = reduced ? "fade" : (allowZoom ? kind : "fade");
  const { variants, transition } = variantsFor(effectiveKind);
  const tx: Transition = reduced ? { duration: 0.05, ease: "linear" } : transition;

  useEffect(() => {
    if (effectiveKind === "camera-zoom") triggerWhoosh();
  }, [transitionKey, effectiveKind]);

  return (
    <div
      className="absolute inset-0"
      style={{ perspective: "var(--slide-perspective)", transformStyle: "preserve-3d" }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={transitionKey}
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={transition}
          className="absolute inset-0"
          style={{ transformStyle: "preserve-3d" }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
