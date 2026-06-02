import { describe, expect, it } from "vitest";

import { useChrome } from "./chrome-store";

describe("chrome.lastUsedThemeId", () => {
  it("defaults to null", () => {
    useChrome.getState().setLastUsedThemeId("");
    useChrome.setState({ lastUsedThemeId: null });
    expect(useChrome.getState().lastUsedThemeId).toBeNull();
  });

  it("setter persists the id", () => {
    useChrome.getState().setLastUsedThemeId("midnight");
    expect(useChrome.getState().lastUsedThemeId).toBe("midnight");
    useChrome.getState().setLastUsedThemeId("snow");
    expect(useChrome.getState().lastUsedThemeId).toBe("snow");
  });
});
