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
  | { ok: true; mode: "already-fullscreen" | "native" | "app" | "presenter-window" }
  | { ok: false; reason: "unsupported" | "native-failed" | "embedded-popup-blocked"; error?: unknown };

export type FullscreenEnvironment = {
  isEmbeddedWindow?: () => boolean;
  openPresenterWindow?: () => Window | null;
};

type FullscreenFailureOptions = { fallbackUrl?: string };

const POPUP_BLOCKED_REASON = "embedded-popup-blocked";
const POPUP_BLOCKED_MESSAGE = "Allow pop-ups to open presenter view";
const FULLSCREEN_BLOCKED_MESSAGE = "Fullscreen blocked by browser";
const SLIDES_FULLSCREEN_STATE_EVENT = "slides:fullscreen-state";
const APP_PRESENTING_ATTR = "data-slides-app-presenting";

let appPresentationMode = false;

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

function notifyFullscreenStateChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SLIDES_FULLSCREEN_STATE_EVENT));
}

export function isAppPresentationMode() {
  return appPresentationMode || isPresenterWindowUrl();
}

export function setAppPresentationMode(active: boolean) {
  appPresentationMode = active;
  if (typeof document !== "undefined") {
    document.documentElement.toggleAttribute(APP_PRESENTING_ATTR, active || isPresenterWindowUrl());
  }
  notifyFullscreenStateChanged();
}

function isFullscreenLike() {
  return typeof document !== "undefined" && (Boolean(document.fullscreenElement) || isAppPresentationMode());
}

/** Tracks whether the document is currently in Fullscreen mode and provides toggles. */
export async function enterFullscreen(target?: HTMLElement | null, environment: FullscreenEnvironment = {}): Promise<FullscreenEnterResult> {
  if (typeof document === "undefined") return { ok: false, reason: "unsupported" };
  if (isFullscreenLike()) return { ok: true, mode: "already-fullscreen" };

  // Browser fullscreen and popups are often blocked in embedded previews. Flip
  // into an in-app presentation surface first so Present/F always has an
  // immediate, visible result; native fullscreen can still enhance it below.
  setAppPresentationMode(true);

  // Fullscreen the stable `/slides` layout root, not the slide/step leaf.
  // It stays mounted across `/slides/N` ↔ `/slides/N/S`, and native fullscreen
  // clips every presenter portal to the same visual surface.
  // On the home route that root does not exist yet, so enter fullscreen on the
  // document first, then the route can change while fullscreen stays active.
  const fullscreenTarget = getSlidesFullscreenRoot() ?? target ?? document.documentElement;

  const embedded = (environment.isEmbeddedWindow ?? isEmbeddedWindow)();

  // Lovable preview iframe cannot enter true browser fullscreen (the host
  // does not set allow="fullscreen"), so attempt a top-level presenter window
  // instead — it CAN request native fullscreen. Only fall back to the in-app
  // cover surface when the popup is blocked. See diagnostics/06-present-fullscreen-preview-rca.md.
  if (embedded) {
    const opener = environment.openPresenterWindow ?? openPresenterWindow;
    const win = opener();
    if (win) {
      setAppPresentationMode(false);
      return { ok: true, mode: "presenter-window" };
    }
    return { ok: false, reason: POPUP_BLOCKED_REASON };
  }


  if (document.fullscreenEnabled === false) {
    return { ok: true, mode: "app" };
  }
  if (!fullscreenTarget?.requestFullscreen) return { ok: true, mode: "app" };

  try {
    await fullscreenTarget.requestFullscreen();
    await lockEscapeKey();
    blurActiveElement();
    notifyFullscreenStateChanged();
    return { ok: true, mode: "native" };
  } catch (error) {
    console.warn("[slides:fullscreen] native fullscreen failed; using in-app presentation mode", error);
    return { ok: true, mode: "app" };
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
      window.addEventListener(SLIDES_FULLSCREEN_STATE_EVENT, sync);
      setAppPresentationMode(appPresentationMode || isPresenterWindowUrl());
      return () => {
        document.removeEventListener("fullscreenchange", sync);
        document.removeEventListener("visibilitychange", sync);
        window.removeEventListener(SLIDES_FULLSCREEN_STATE_EVENT, sync);
      };
    },
    () => (typeof document === "undefined" ? false : Boolean(document.fullscreenElement) || isAppPresentationMode()),
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
      setAppPresentationMode(false);
      unlockEscapeKey();
      blurActiveElement();
      notifyFullscreenStateChanged();
    } catch { /* ignore */ }
  };
  const toggle = (target?: HTMLElement | null) => (isFullscreenLike() ? exit() : enter(target));

  return { isFs, isPresenterContext: isFs || isPresenterWindowUrl(), enter, exit, toggle };
}
