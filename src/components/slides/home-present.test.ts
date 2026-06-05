import { describe, expect, it } from "vitest";

import { getHomePresentUrl, shouldNavigateHomeAfterPresent } from "./home-present";

describe("home presenter launcher", () => {
  it("opens the first slide with presenter auto-start armed", () => {
    expect(getHomePresentUrl("https://deck.test")).toBe("https://deck.test/slides/1?present=1");
  });

  it("stays on home when presenter popup fallback owns recovery", () => {
    expect(shouldNavigateHomeAfterPresent({ ok: true, mode: "presenter-window" })).toBe(false);
    expect(shouldNavigateHomeAfterPresent({ ok: false, reason: "embedded-popup-blocked" })).toBe(false);
    expect(shouldNavigateHomeAfterPresent({ ok: true, mode: "native" })).toBe(true);
  });
});