import { afterEach, describe, expect, it, vi } from "vitest";

import { useChrome } from "./chrome-store";
import { getSlidesFullscreenRoot, getSlidesPortalRoot } from "./fullscreenTarget";
import { enterFullscreen, reportFullscreenFailure } from "./useFullscreen";

describe("slide fullscreen target", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      get: () => null,
    });
    Object.defineProperty(document, "fullscreenEnabled", {
      configurable: true,
      value: true,
    });
    Object.defineProperty(document.documentElement, "requestFullscreen", {
      configurable: true,
      value: undefined,
    });
    vi.restoreAllMocks();
    useChrome.setState({ presenterFallback: null, toast: null });
  });

  it("uses the stable slides root as the native target so route remounts cannot exit fullscreen", async () => {
    const stableRoot = document.createElement("div");
    stableRoot.setAttribute("data-slides-fullscreen-root", "");
    const transientSlide = document.createElement("button");
    document.body.append(stableRoot, transientSlide);

    const stableRequest = vi.fn().mockResolvedValue(undefined);
    const transientRequest = vi.fn().mockResolvedValue(undefined);
    const documentRequest = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(stableRoot, "requestFullscreen", { value: stableRequest });
    Object.defineProperty(transientSlide, "requestFullscreen", { value: transientRequest });
    Object.defineProperty(document.documentElement, "requestFullscreen", { configurable: true, value: documentRequest });

    await enterFullscreen(transientSlide);

    expect(stableRequest).toHaveBeenCalledOnce();
    expect(documentRequest).not.toHaveBeenCalled();
    expect(transientRequest).not.toHaveBeenCalled();
    expect(getSlidesFullscreenRoot()).toBe(stableRoot);
  });

  it("ports fullscreen UI into the stable slides root even when the document element is fullscreen", () => {
    const stableRoot = document.createElement("div");
    stableRoot.setAttribute("data-slides-fullscreen-root", "");
    document.body.append(stableRoot);
    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      get: () => document.documentElement,
    });

    expect(getSlidesPortalRoot()).toBe(stableRoot);
  });

  it("does not silently fall back to body when no fullscreen portal root exists", () => {
    expect(getSlidesPortalRoot()).toBeNull();
  });

  it("tries native fullscreen before using the embedded presenter-window fallback", async () => {
    const stableRoot = document.createElement("div");
    stableRoot.setAttribute("data-slides-fullscreen-root", "");
    document.body.append(stableRoot);
    const stableRequest = vi.fn().mockResolvedValue(undefined);
    const openPresenterWindow = vi.fn(() => ({ focus: vi.fn() }) as unknown as Window);
    Object.defineProperty(stableRoot, "requestFullscreen", { value: stableRequest });

    const result = await enterFullscreen(stableRoot, {
      isEmbeddedWindow: () => true,
      openPresenterWindow,
    });

    expect(result).toEqual({ ok: true, mode: "native" });
    expect(stableRequest).toHaveBeenCalledOnce();
    expect(openPresenterWindow).not.toHaveBeenCalled();
  });

  it("uses the embedded presenter-window fallback only after native fullscreen fails", async () => {
    const stableRoot = document.createElement("div");
    stableRoot.setAttribute("data-slides-fullscreen-root", "");
    document.body.append(stableRoot);
    const openPresenterWindow = vi.fn(() => ({ focus: vi.fn() }) as unknown as Window);
    Object.defineProperty(stableRoot, "requestFullscreen", { value: vi.fn().mockRejectedValue(new Error("denied")) });

    const result = await enterFullscreen(stableRoot, {
      isEmbeddedWindow: () => true,
      openPresenterWindow,
    });

    expect(result).toEqual({ ok: true, mode: "presenter-window" });
    expect(openPresenterWindow).toHaveBeenCalledOnce();
  });

  it("reports blocked presenter-window fallback when native fullscreen fails and embedded popups are blocked", async () => {
    const stableRoot = document.createElement("div");
    stableRoot.setAttribute("data-slides-fullscreen-root", "");
    document.body.append(stableRoot);
    Object.defineProperty(stableRoot, "requestFullscreen", { value: vi.fn().mockRejectedValue(new Error("denied")) });

    const result = await enterFullscreen(null, {
      isEmbeddedWindow: () => true,
      openPresenterWindow: () => null,
    });

    expect(result).toEqual({ ok: false, reason: "embedded-popup-blocked" });
  });

  it("surfaces a persistent fallback URL when presenter popup is blocked", () => {
    reportFullscreenFailure(
      { ok: false, reason: "embedded-popup-blocked" },
      { fallbackUrl: "http://localhost/slides/1?present=1" },
    );

    expect(useChrome.getState().toast?.text).toBe("Allow pop-ups to open presenter view");
    expect(useChrome.getState().presenterFallback?.url).toBe("http://localhost/slides/1?present=1");
  });

  it("returns unsupported before calling requestFullscreen when the document disallows fullscreen", async () => {
    const stableRoot = document.createElement("div");
    stableRoot.setAttribute("data-slides-fullscreen-root", "");
    const stableRequest = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(stableRoot, "requestFullscreen", { value: stableRequest });
    Object.defineProperty(document, "fullscreenEnabled", { configurable: true, value: false });
    document.body.append(stableRoot);

    const result = await enterFullscreen(stableRoot, { isEmbeddedWindow: () => false });

    expect(result).toEqual({ ok: false, reason: "unsupported" });
    expect(stableRequest).not.toHaveBeenCalled();
  });

  it("returns a native failure result instead of swallowing rejected fullscreen requests", async () => {
    const stableRoot = document.createElement("div");
    stableRoot.setAttribute("data-slides-fullscreen-root", "");
    document.body.append(stableRoot);
    const error = new Error("fullscreen denied");
    Object.defineProperty(stableRoot, "requestFullscreen", {
      configurable: true,
      value: vi.fn().mockRejectedValue(error),
    });
    Object.defineProperty(document.documentElement, "requestFullscreen", {
      configurable: true,
      value: vi.fn().mockRejectedValue(error),
    });

    const result = await enterFullscreen(stableRoot, { isEmbeddedWindow: () => false });

    expect(result).toEqual({ ok: false, reason: "native-failed", error });
  });
});