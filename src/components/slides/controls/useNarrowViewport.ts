import { useEffect, useState } from "react";

const NARROW_MAX_WIDTH_PX = 1279;
const NARROW_QUERY = `(max-width: ${NARROW_MAX_WIDTH_PX}px)`;

/**
 * Returns true when viewport width <= 1279px. Used by ControllerPill to
 * collapse secondary actions (Theme, Music, Help, Settings) behind a "⋯"
 * overflow menu so narrow laptops/tablets don't overflow the toolbar.
 */
export function useNarrowViewport(): boolean {
  const [isNarrow, setIsNarrow] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia(NARROW_QUERY);
    const sync = () => setIsNarrow(mql.matches);
    sync();
    mql.addEventListener?.("change", sync);
    return () => mql.removeEventListener?.("change", sync);
  }, []);
  return isNarrow;
}

export const NARROW_VIEWPORT_BREAKPOINT_PX = NARROW_MAX_WIDTH_PX;
