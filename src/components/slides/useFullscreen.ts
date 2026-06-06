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

export type FullscreenEnvironment = {
  isEmbeddedWindow?: () => boolean;
  openPresenterWindow?: () => Window | null;
};

type FullscreenFailureOptions = { fallbackUrl?: string };

const POPUP_BLOCKED_REASON = "embedded-popup-blocked";
const POPUP_BLOCKED_MESSAGE = "Allow pop-ups to open presenter view";
const FULLSCREEN_BLOCKED_MESSAGE = "Fullscreen blocked by browser";

export function isEmbeddedWindow() {
  if (typeof window === "undefined") return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export function isPresenterWindowUrl(href?: string) {
  const source = href ?? (typeof window === "undefined" ? "" : window.location.href);
  if (!source) return false;
  try {
    return new URL(source).searchParams.get("present") === "1";
  } catch (error) {
    console.warn("[slides:fullscreen] invalid presenter URL", { href: source, error });
    return false;
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

  // Fullscreen the stable `/slides` layout root, not the slide/step leaf.
  // It stays mounted across `/slides/N` ↔ `/slides/N/S`, and native fullscreen
  // clips every presenter portal to the same visual surface.
  // On the home route that root does not exist yet, so enter fullscreen on the
  // document first, then the route can change while fullscreen stays active.
  const fullscreenTarget = getSlidesFullscreenRoot() ?? target ?? document.documentElement;

  // Embedded preview iframes without `allow="fullscreen"` set
  // `document.fullscreenEnabled === false`. In that case `requestFullscreen`
  // can never succeed, so skip it and route directly to the presenter popup
  // instead of returning a silent `unsupported`. Top-level windows still try
  // native fullscreen first and only fall back on failure (see catch below).
  const openWindow = environment.openPresenterWindow ?? openPresenterWindow;

  if (document.fullscreenEnabled === false) {
    const embedded = (environment.isEmbeddedWindow ?? isEmbeddedWindow)();
    if (embedded) {
      const opened = openWindow();
      return opened ? { ok: true, mode: "presenter-window" } : { ok: false, reason: "embedded-popup-blocked" };
    }
    return { ok: false, reason: "unsupported" };
  }
  if (!fullscreenTarget?.requestFullscreen) return { ok: false, reason: "unsupported" };

  try {
    await fullscreenTarget.requestFullscreen();
    await lockEscapeKey();
    blurActiveElement();
    return { ok: true, mode: "native" };
  } catch (error) {
    const embedded = (environment.isEmbeddedWindow ?? isEmbeddedWindow)();
    if (embedded) {
      const opened = openWindow();
      return opened ? { ok: true, mode: "presenter-window" } : { ok: false, reason: "embedded-popup-blocked" };
    }
    return { ok: false, reason: "native-failed", error };
  }
}

function fullscreenFailureMessage(result: FullscreenEnterResult) {
  if (result.ok) return "";
  return result.reason === POPUP_BLOCKED_REASON ? POPUP_BLOCKED_MESSAGE : FULLSCREEN_BLOCKED_MESSAGE;
}

function presenterFallbackUrl(options: FullscreenFailureOptions) {
  return options.fallbackUrl ?? getPresenterWindowUrl();
}

export function reportFullscreenFailure(result: FullscreenEnterResult, options: FullscreenFailureOptions = {}) {
  if (result.ok) {
    useChrome.getState().clearPresenterFallback();
    return;
  }
  useChrome.getState().flashToast(fullscreenFailureMessage(result));
  if (result.reason !== POPUP_BLOCKED_REASON) return;
  useChrome.getState().showPresenterFallback(presenterFallbackUrl(options), "popup-blocked");
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
      document.addEventListener("visibilitychange", sync);
      return () => {
        document.removeEventListener("fullscreenchange", sync);
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

  return { isFs, isPresenterContext: isFs || isPresenterWindowUrl(), enter, exit, toggle };
}
