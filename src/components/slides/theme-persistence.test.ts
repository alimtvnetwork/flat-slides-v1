import { beforeEach, describe, expect, it } from "vitest";

import { useChrome } from "./chrome-store";
import { useDeck } from "./store";
import { DEFAULT_THEME_ID } from "./themes";

describe("theme persistence wiring", () => {
  beforeEach(() => {
    useChrome.setState({ lastUsedThemeId: null });
  });

  it("setThemeId writes to chrome.lastUsedThemeId", () => {
    useDeck.getState().setThemeId("midnight");
    expect(useChrome.getState().lastUsedThemeId).toBe("midnight");
  });

  it("resetDeck reuses chrome.lastUsedThemeId when set", () => {
    useChrome.getState().setLastUsedThemeId("midnight");
    useDeck.getState().resetDeck();
    expect(useDeck.getState().themeId).toBe("midnight");
    expect(useDeck.getState().deck.themeId).toBe("midnight");
  });

  it("resetDeck falls back to DEFAULT_THEME_ID when chrome has no preference", () => {
    useDeck.getState().resetDeck();
    expect(useDeck.getState().themeId).toBe(DEFAULT_THEME_ID);
  });
});
