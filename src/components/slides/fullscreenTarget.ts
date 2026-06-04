export const SLIDES_FULLSCREEN_ROOT_SELECTOR = "[data-slides-fullscreen-root]";

export function getSlidesFullscreenRoot() {
  if (typeof document === "undefined") return null;
  return document.querySelector<HTMLElement>(SLIDES_FULLSCREEN_ROOT_SELECTOR);
}

export function getSlidesPortalRoot() {
  if (typeof document === "undefined") return null;
  return getSlidesFullscreenRoot() ?? (document.fullscreenElement as HTMLElement | null) ?? document.body;
}