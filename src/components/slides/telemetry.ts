/**
 * Tiny CustomEvent bus for presenter telemetry. Use window events so analytics
 * code can subscribe without coupling to zustand. Payloads are intentionally
 * small and serializable.
 */

export type SlidesEventDetail =
  | { type: "slide-change"; current: number; total: number; slideId?: string; title?: string }
  | { type: "step-change"; current: number; step: number; stepCount: number }
  | { type: "scene-change"; scene: string }
  | { type: "theme-change"; themeId: string }
  | { type: "deck-load"; slideCount: number; deckId?: string; title?: string }
  | { type: "lint-issue-clicked"; rule: string; severity: "warn" | "error"; slideId?: string };


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

/**
 * Dev-only console sink. Subscribes to `slides:event` and prints a compact,
 * grouped log line. Returns an unsubscribe; call once per app boot.
 * No-op in production builds.
 */
export function installConsoleSink(): () => void {
  if (typeof window === "undefined") return () => {};
  if (import.meta.env.PROD) return () => {};
  return onSlidesEvent((d) => {
    // eslint-disable-next-line no-console
    console.debug("[slides]", d.type, d);
  });
}

