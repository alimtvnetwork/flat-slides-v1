import type { FullscreenEnterResult } from "./useFullscreen";

export const HOME_PRESENT_SLIDE_ID = "1";
export const HOME_PRESENT_PARAM = "present";
export const HOME_PRESENT_VALUE = "1";

export function getHomePresentUrl(origin: string) {
  const url = new URL(`/slides/${HOME_PRESENT_SLIDE_ID}`, origin);
  url.searchParams.set(HOME_PRESENT_PARAM, HOME_PRESENT_VALUE);
  return url.toString();
}

export function openHomePresenterWindow() {
  const opened = window.open(getHomePresentUrl(window.location.origin), "_blank", "popup");
  if (!opened) return null;
  opened.opener = null;
  opened.focus?.();
  return opened;
}

export function shouldNavigateHomeAfterPresent(result: FullscreenEnterResult) {
  if (result.ok && result.mode === "presenter-window") return false;
  if (!result.ok && result.reason === "embedded-popup-blocked") return false;
  return true;
}