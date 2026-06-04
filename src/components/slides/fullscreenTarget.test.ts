import { afterEach, describe, expect, it, vi } from "vitest";

import { getSlidesFullscreenRoot, getSlidesPortalRoot } from "./fullscreenTarget";
import { enterFullscreen } from "./useFullscreen";

describe("slide fullscreen target", () => {
  afterEach(() => {
    document.body.innerHTML = "";
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
});