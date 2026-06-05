import { useLocation } from "@tanstack/react-router";

/**
 * Returns the current 1-based slide number from the URL, defaulting to 1
 * when the route does not match `/slides/N(...)`. Used by controller items
 * that need to deep-link to the inspector or other per-slide tools without
 * threading the slide number through prop chains.
 */
export function useSlideNumber(): number {
  const { pathname } = useLocation();
  const match = pathname.match(/\/slides\/(?:inspector\/)?(\d+)/);
  const parsed = match ? Number.parseInt(match[1], 10) : 1;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}
