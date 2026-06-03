import { describe, expect, it } from "vitest";

import { useChrome } from "./chrome-store";

describe("chrome.clearLastUsedThemeId", () => {
  it("resets lastUsedThemeId to null", () => {
    useChrome.getState().setLastUsedThemeId("midnight");
    expect(useChrome.getState().lastUsedThemeId).toBe("midnight");
    useChrome.getState().clearLastUsedThemeId();
    expect(useChrome.getState().lastUsedThemeId).toBeNull();
  });

  it("is idempotent when already null", () => {
    useChrome.getState().clearLastUsedThemeId();
    useChrome.getState().clearLastUsedThemeId();
    expect(useChrome.getState().lastUsedThemeId).toBeNull();
  });
});
