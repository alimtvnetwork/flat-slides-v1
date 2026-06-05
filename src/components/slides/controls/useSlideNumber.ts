/**
 * Returns the current 1-based slide number from `window.location.pathname`,
 * defaulting to 1 when the route does not match `/slides/N(...)`. Uses the
 * raw location instead of `useLocation()` so the hook works in test
 * harnesses that mount controller components without a router (the existing
 * `ControllerOverflowMenu` tests render outside `<RouterProvider>`).
 */
export function useSlideNumber(): number {
  if (typeof window === "undefined") return 1;
  const match = window.location.pathname.match(/\/slides\/(?:inspector\/)?(\d+)/);
  const parsed = match ? Number.parseInt(match[1], 10) : 1;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}
