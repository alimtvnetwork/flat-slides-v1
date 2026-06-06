import { afterEach, describe, expect, it, vi } from "vitest";

import { useChrome } from "./chrome-store";
import { getSlidesFullscreenRoot, getSlidesPortalRoot } from "./fullscreenTarget";
import { enterFullscreen, isPresenterWindowUrl, reportFullscreenFailure, setAppPresentationMode } from "./useFullscreen";

describe("slide fullscreen target", () => {
  afterEach(() => {
    setAppPresentationMode(false);
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

  it("opens a top-level presenter window when embedded so true browser fullscreen is reachable", async () => {
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

    expect(result).toEqual({ ok: true, mode: "presenter-window" });
    expect(stableRequest).not.toHaveBeenCalled();
    expect(openPresenterWindow).toHaveBeenCalledOnce();
    expect(document.documentElement.hasAttribute("data-slides-app-presenting")).toBe(false);
  });


  it("reports popup-blocked when embedded and the presenter window is unavailable", async () => {
    const stableRoot = document.createElement("div");
    stableRoot.setAttribute("data-slides-fullscreen-root", "");
    document.body.append(stableRoot);
    const stableRequest = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(stableRoot, "requestFullscreen", { value: stableRequest });

    const result = await enterFullscreen(stableRoot, {
      isEmbeddedWindow: () => true,
      openPresenterWindow: () => null,
    });

    expect(result).toEqual({ ok: false, reason: "embedded-popup-blocked" });
    expect(stableRequest).not.toHaveBeenCalled();
  });

  it("reports popup-blocked when embedded native fullscreen would fail and popup is blocked", async () => {
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

  it("falls back to in-app presentation when the document disallows fullscreen", async () => {
    const stableRoot = document.createElement("div");
    stableRoot.setAttribute("data-slides-fullscreen-root", "");
    const stableRequest = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(stableRoot, "requestFullscreen", { value: stableRequest });
    Object.defineProperty(document, "fullscreenEnabled", { configurable: true, value: false });
    document.body.append(stableRoot);

    const result = await enterFullscreen(stableRoot, { isEmbeddedWindow: () => false });

    expect(result).toEqual({ ok: true, mode: "app" });
    expect(stableRequest).not.toHaveBeenCalled();
  });

  it("falls back to in-app presentation when native fullscreen rejects", async () => {
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

    expect(result).toEqual({ ok: true, mode: "app" });
  });

  it("routes embedded preview iframes straight to in-app presentation when fullscreen is disabled", async () => {
    // Lovable preview iframe: host lacks allow="fullscreen" so
    // document.fullscreenEnabled === false. The native attempt can never
    // succeed; we must use the popup fallback instead of returning silent
    // "unsupported". Regression for spec/issues/001-preview-iframe-fullscreen.md.
    Object.defineProperty(document, "fullscreenEnabled", { configurable: true, value: false });
    const stableRoot = document.createElement("div");
    stableRoot.setAttribute("data-slides-fullscreen-root", "");
    const stableRequest = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(stableRoot, "requestFullscreen", { value: stableRequest });
    document.body.append(stableRoot);
    const openPresenterWindow = vi.fn(() => ({ focus: vi.fn() }) as unknown as Window);

    const result = await enterFullscreen(stableRoot, {
      isEmbeddedWindow: () => true,
      openPresenterWindow,
    });

    expect(result).toEqual({ ok: true, mode: "app" });
    expect(stableRequest).not.toHaveBeenCalled();
    expect(openPresenterWindow).not.toHaveBeenCalled();
  });

  it("uses in-app presentation from slide pages when embedded fullscreen is disabled", async () => {
    Object.defineProperty(document, "fullscreenEnabled", { configurable: true, value: false });
    const opened = { focus: vi.fn(), opener: window } as unknown as Window;
    const open = vi.spyOn(window, "open").mockReturnValue(opened);

    const result = await enterFullscreen(null, { isEmbeddedWindow: () => true });

    expect(result).toEqual({ ok: true, mode: "app" });
    expect(open).not.toHaveBeenCalled();
  });

  it("still enters in-app presentation when an iframe popup fallback would be blocked", async () => {
    Object.defineProperty(document, "fullscreenEnabled", { configurable: true, value: false });
    const stableRoot = document.createElement("div");
    stableRoot.setAttribute("data-slides-fullscreen-root", "");
    document.body.append(stableRoot);

    const result = await enterFullscreen(stableRoot, {
      isEmbeddedWindow: () => true,
      openPresenterWindow: () => null,
    });

    expect(result).toEqual({ ok: true, mode: "app" });
  });

  it("treats ?present=1 as a presenter context for fullscreen-only overlays", () => {
    expect(isPresenterWindowUrl("http://localhost/slides/2?present=1")).toBe(true);
    expect(isPresenterWindowUrl("http://localhost/slides/2?present=0")).toBe(false);
  });
});