import { useSyncExternalStore } from "react";

import { getSlidesFullscreenRoot } from "./fullscreenTarget";

type KeyboardLockNavigator = Navigator & {
  keyboard?: {
    lock?: (keys?: string[]) => Promise<void>;
    unlock?: () => void;
  };
};

async function lockEscapeKey() {
  if (typeof navigator === "undefined") return;
  try {
    await (navigator as KeyboardLockNavigator).keyboard?.lock?.(["Escape"]);
  } catch {
    /* Keyboard Lock is browser/permission dependent. Native fullscreen still works without it. */
  }
}

function unlockEscapeKey() {
  if (typeof navigator === "undefined") return;
  try {
    (navigator as KeyboardLockNavigator).keyboard?.unlock?.();
  } catch {
    /* ignore */
  }
}

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
export async function enterFullscreen(target?: HTMLElement | null) {
  if (document.fullscreenElement) return;
  const stableSlidesRoot = getSlidesFullscreenRoot();
  const fullscreenTarget = stableSlidesRoot ?? target ?? document.documentElement;
  await fullscreenTarget.requestFullscreen();
  await lockEscapeKey();
  blurActiveElement();
}

export function useFullscreen() {
  const isFs = useSyncExternalStore(
    (notify) => {
      if (typeof document === "undefined") return () => {};
      const sync = () => {
        if (document.fullscreenElement) void lockEscapeKey();
        else unlockEscapeKey();
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
      await enterFullscreen(target);
    } catch { /* ignore */ }
  };
  const exit = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      unlockEscapeKey();
      blurActiveElement();
    } catch { /* ignore */ }
  };
  const toggle = (target?: HTMLElement | null) => (document.fullscreenElement ? exit() : enter(target));

  return { isFs, enter, exit, toggle };
}
