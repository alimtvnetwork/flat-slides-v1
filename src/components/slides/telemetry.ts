/**
 * Tiny CustomEvent bus for presenter telemetry. Use window events so analytics
 * code can subscribe without coupling to zustand. Payloads are intentionally
 * small and serializable.
 */

export type SlidesEventDetail =
  | { type: "slide-change"; current: number; total: number; slideId?: string; title?: string }
  | { type: "step-change"; current: number; step: number; stepCount: number }
  | { type: "scene-change"; scene: string }
  | { type: "theme-change"; themeId: string };

export const SLIDES_EVENT = "slides:event" as const;

export function emitSlidesEvent(detail: SlidesEventDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SLIDES_EVENT, { detail }));
}

export function onSlidesEvent(handler: (detail: SlidesEventDetail) => void) {
  if (typeof window === "undefined") return () => {};
  const listener = (e: Event) => handler((e as CustomEvent<SlidesEventDetail>).detail);
  window.addEventListener(SLIDES_EVENT, listener);
  return () => window.removeEventListener(SLIDES_EVENT, listener);
}
