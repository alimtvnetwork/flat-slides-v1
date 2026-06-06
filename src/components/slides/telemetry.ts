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
  | { type: "home-launcher-click"; case: string }
  | { type: "lint-issue-clicked"; rule: string; severity: "warn" | "error"; slideId?: string };


export const SLIDES_EVENT = "slides:event" as const;

/**
 * Dev-only ring buffer of the most recent slides events. Exposed on
 * `window.__slidesEvents` so DevTools / the settings drawer dev panel
 * can answer "which launcher case did the user just press?" without
 * needing an external analytics sink. Never populated in production.
 */
export const SLIDES_EVENT_BUFFER_CAP = 200;
type BufferedEvent = SlidesEventDetail & { at: number };

declare global {
  interface Window {
    __slidesEvents?: BufferedEvent[];
  }
}

function pushToBuffer(detail: SlidesEventDetail) {
  if (typeof window === "undefined") return;
  if (import.meta.env.PROD) return;
  const buf = (window.__slidesEvents ??= []);
  buf.push({ ...detail, at: Date.now() });
  if (buf.length > SLIDES_EVENT_BUFFER_CAP) {
    buf.splice(0, buf.length - SLIDES_EVENT_BUFFER_CAP);
  }
}

export function emitSlidesEvent(detail: SlidesEventDetail) {
  if (typeof window === "undefined") return;
  pushToBuffer(detail);
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

