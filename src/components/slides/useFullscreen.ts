import { useSyncExternalStore } from "react";

import { getSlidesFullscreenRoot } from "./fullscreenTarget";

function blurActiveElement() {
  if (typeof document === "undefined") return;
  const blur = () => {
    const active = document.activeElement;
    if (active instanceof HTMLElement && active !== document.body && active !== document.documentElement) {
      active.blur();
    }
  };
  blur();
  requestAnimationFrame(blur);
}

/** Tracks whether the document is currently in Fullscreen mode and provides toggles. */
export function useFullscreen() {
  const isFs = useSyncExternalStore(
    (notify) => {
      if (typeof document === "undefined") return () => {};
      const sync = () => {
        blurActiveElement();
        notify();
      };
      document.addEventListener("fullscreenchange", sync);
      window.addEventListener("focus", sync);
      document.addEventListener("visibilitychange", sync);
      return () => {
        document.removeEventListener("fullscreenchange", sync);
        window.removeEventListener("focus", sync);
        document.removeEventListener("visibilitychange", sync);
      };
    },
    () => (typeof document === "undefined" ? false : Boolean(document.fullscreenElement)),
    () => false,
  );

  const enter = async (target?: HTMLElement | null) => {
    try {
      if (document.fullscreenElement) return;
      const stableSlidesRoot = getSlidesFullscreenRoot();
      const fullscreenTarget = stableSlidesRoot ?? target ?? document.documentElement;
      await fullscreenTarget.requestFullscreen();
      blurActiveElement();
    } catch { /* ignore */ }
  };
  const exit = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      blurActiveElement();
    } catch { /* ignore */ }
  };
  const toggle = (target?: HTMLElement | null) => (document.fullscreenElement ? exit() : enter(target));

  return { isFs, enter, exit, toggle };
}
