import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

import { useReducedMotion } from "@/components/slides/useReducedMotion";

export const HOVER_REVEAL_EXPAND_MS = 160;
export const HOVER_REVEAL_COLLAPSE_GRACE_MS = 400;
const OPEN_CHILD_SELECTOR = '[data-state="open"]';

/**
 * Hover/focus-reveal state machine for the controller pill.
 * - 160ms intent delay before expand (avoids flicker on mouse fly-over).
 * - 400ms grace before collapse (so users don't lose it on quick mouse-out).
 * - Stays open while a child popover/menu is mounted (data-state="open").
 *
 * Step 28 (B21) a11y: under `prefers-reduced-motion: reduce` both timers
 * collapse to 0ms — the chip expands and collapses instantly. Per core
 * memory rule, any animated slide surface must consult useReducedMotion().
 */
export function useHoverReveal(containerRef: RefObject<HTMLElement | null>) {
  const reduced = useReducedMotion();
  const [isExpanded, setIsExpanded] = useState(true);
  const expandTimer = useRef<number | null>(null);
  const collapseTimer = useRef<number | null>(null);

  const expandDelay = reduced ? 0 : HOVER_REVEAL_EXPAND_MS;
  const collapseDelay = reduced ? 0 : HOVER_REVEAL_COLLAPSE_GRACE_MS;

  const clearExpand = () => {
    if (expandTimer.current === null) return;
    window.clearTimeout(expandTimer.current);
    expandTimer.current = null;
  };

  const clearCollapse = () => {
    if (collapseTimer.current === null) return;
    window.clearTimeout(collapseTimer.current);
    collapseTimer.current = null;
  };

  const hasOpenChild = useCallback(() => {
    return Boolean(containerRef.current?.querySelector(OPEN_CHILD_SELECTOR));
  }, [containerRef]);

  const scheduleCollapse = useCallback(() => {
    clearCollapse();
    collapseTimer.current = window.setTimeout(() => {
      collapseTimer.current = null;
      if (hasOpenChild()) {
        scheduleCollapse();
        return;
      }
      setIsExpanded(false);
    }, collapseDelay);
  }, [hasOpenChild, collapseDelay]);

  const handleEnter = useCallback(() => {
    clearCollapse();
    if (expandTimer.current !== null) return;
    expandTimer.current = window.setTimeout(() => {
      expandTimer.current = null;
      setIsExpanded(true);
    }, expandDelay);
  }, [expandDelay]);

  const handleLeave = useCallback(() => {
    clearExpand();
    scheduleCollapse();
  }, [scheduleCollapse]);

  useEffect(() => {
    return () => {
      clearExpand();
      clearCollapse();
    };
  }, []);

  return { isExpanded, handleEnter, handleLeave };
}
