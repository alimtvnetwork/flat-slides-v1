export const SLIDES_FULLSCREEN_NAVIGATION_EVENT = "slides:fullscreen-navigation";

export type SlidesFullscreenNavigationDetail = {
  slideId: string;
  step?: number;
  pathname: string;
};

export function canUseFullscreenHistoryNavigation() {
  return typeof window !== "undefined" && typeof document !== "undefined" && Boolean(document.fullscreenElement);
}

export function buildSlidePath(slideId: string, step?: number) {
  return step && step > 1 ? `/slides/${slideId}/${step}` : `/slides/${slideId}`;
}

export function replaceFullscreenSlideUrl(slideId: string, step?: number, search = "") {
  if (typeof window === "undefined") return;
  const pathname = buildSlidePath(slideId, step);
  window.history.replaceState(window.history.state, "", `${pathname}${search}`);
  window.dispatchEvent(
    new CustomEvent<SlidesFullscreenNavigationDetail>(SLIDES_FULLSCREEN_NAVIGATION_EVENT, {
      detail: { slideId, step, pathname },
    }),
  );
}