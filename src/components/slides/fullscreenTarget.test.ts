import { afterEach, describe, expect, it, vi } from "vitest";

import { getSlidesFullscreenRoot, getSlidesPortalRoot } from "./fullscreenTarget";
import { enterFullscreen } from "./useFullscreen";

describe("slide fullscreen target", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      get: () => null,
    });
    vi.restoreAllMocks();
  });

  it("prefers the stable slides root over transient child targets", async () => {
    const stableRoot = document.createElement("div");
    stableRoot.setAttribute("data-slides-fullscreen-root", "");
    const transientSlide = document.createElement("button");
    document.body.append(stableRoot, transientSlide);

    const stableRequest = vi.fn().mockResolvedValue(undefined);
    const transientRequest = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(stableRoot, "requestFullscreen", { value: stableRequest });
    Object.defineProperty(transientSlide, "requestFullscreen", { value: transientRequest });

    await enterFullscreen(transientSlide);

    expect(stableRequest).toHaveBeenCalledOnce();
    expect(transientRequest).not.toHaveBeenCalled();
    expect(getSlidesFullscreenRoot()).toBe(stableRoot);
  });

  it("ports fullscreen UI into the native fullscreen element", () => {
    const stableRoot = document.createElement("div");
    stableRoot.setAttribute("data-slides-fullscreen-root", "");
    document.body.append(stableRoot);
    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      get: () => stableRoot,
    });

    expect(getSlidesPortalRoot()).toBe(stableRoot);
  });

  it("opens a top-level presenter window instead of iframe-scoped fullscreen when embedded", async () => {
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
    expect(openPresenterWindow).toHaveBeenCalledOnce();
    expect(stableRequest).not.toHaveBeenCalled();
  });

  it("reports blocked presenter-window fallback when embedded popups are blocked", async () => {
    const result = await enterFullscreen(null, {
      isEmbeddedWindow: () => true,
      openPresenterWindow: () => null,
    });

    expect(result).toEqual({ ok: false, reason: "embedded-popup-blocked" });
  });

  it("returns a native failure result instead of swallowing rejected fullscreen requests", async () => {
    const stableRoot = document.createElement("div");
    stableRoot.setAttribute("data-slides-fullscreen-root", "");
    document.body.append(stableRoot);
    const error = new Error("fullscreen denied");
    Object.defineProperty(stableRoot, "requestFullscreen", { value: vi.fn().mockRejectedValue(error) });

    const result = await enterFullscreen(stableRoot, { isEmbeddedWindow: () => false });

    expect(result).toEqual({ ok: false, reason: "native-failed", error });
  });
});