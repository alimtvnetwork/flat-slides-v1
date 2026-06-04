import { useSyncExternalStore } from "react";

import { useChrome } from "./chrome-store";
import { getSlidesFullscreenRoot } from "./fullscreenTarget";

type KeyboardLockNavigator = Navigator & {
  keyboard?: {
    lock?: (keys?: string[]) => Promise<void>;
    unlock?: () => void;
  };
};

export type FullscreenEnterResult =
  | { ok: true; mode: "already-fullscreen" | "native" | "presenter-window" }
  | { ok: false; reason: "unsupported" | "native-failed" | "embedded-popup-blocked"; error?: unknown };

type FullscreenEnvironment = {
  isEmbeddedWindow?: () => boolean;
  openPresenterWindow?: () => Window | null;
};

export function isEmbeddedWindow() {
  if (typeof window === "undefined") return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export function getPresenterWindowUrl(href?: string) {
  const source = href ?? (typeof window === "undefined" ? "" : window.location.href);
  if (!source) return "";
  const url = new URL(source);
  // Signal to the new top-level window that it should auto-prompt for fullscreen.
  url.searchParams.set("present", "1");
  return url.toString();
}

export function openPresenterWindow() {
  if (typeof window === "undefined") return null;
  // Do not pass `noopener` here: several browsers return `null` for a
  // successfully opened window when noopener is set, which is indistinguishable
  // from a blocked popup. Null the opener immediately after we get the handle.
  const opened = window.open(getPresenterWindowUrl(), "_blank", "popup");
  if (opened) {
    try {
      opened.opener = null;
    } catch {
      /* ignore */
    }
    opened.focus?.();
  }
  return opened;
}

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
export async function enterFullscreen(target?: HTMLElement | null, environment: FullscreenEnvironment = {}): Promise<FullscreenEnterResult> {
  if (typeof document === "undefined") return { ok: false, reason: "unsupported" };
  if (document.fullscreenElement) return { ok: true, mode: "already-fullscreen" };

  const embedded = (environment.isEmbeddedWindow ?? isEmbeddedWindow)();
  if (embedded) {
    const opened = (environment.openPresenterWindow ?? openPresenterWindow)();
    return opened ? { ok: true, mode: "presenter-window" } : { ok: false, reason: "embedded-popup-blocked" };
  }

  const stableSlidesRoot = getSlidesFullscreenRoot();
  const fullscreenTarget = stableSlidesRoot ?? target ?? document.documentElement;
  if (document.fullscreenEnabled === false) return { ok: false, reason: "unsupported" };
  if (!fullscreenTarget.requestFullscreen) return { ok: false, reason: "unsupported" };

  try {
    await fullscreenTarget.requestFullscreen();
    await lockEscapeKey();
    blurActiveElement();
    return { ok: true, mode: "native" };
  } catch (error) {
    return { ok: false, reason: "native-failed", error };
  }
}

function reportFullscreenFailure(result: FullscreenEnterResult) {
  if (result.ok) {
    useChrome.getState().clearPresenterFallback();
    return;
  }
  const message =
    result.reason === "embedded-popup-blocked"
      ? "Allow pop-ups to open presenter view"
      : "Fullscreen blocked by browser";
  useChrome.getState().flashToast(message);
  if (result.reason === "embedded-popup-blocked") {
    useChrome.getState().showPresenterFallback(getPresenterWindowUrl(), "popup-blocked");
  }
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
    const result = await enterFullscreen(target);
    reportFullscreenFailure(result);
    return result;
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
