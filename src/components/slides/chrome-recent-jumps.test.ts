import { describe, expect, it } from "vitest";

import { useChrome } from "./chrome-store";

describe("chrome.setRecentJumps", () => {
  it("replaces the list wholesale", () => {
    useChrome.getState().setRecentJumps([5, 4, 3]);
    expect(useChrome.getState().recentJumps).toEqual([5, 4, 3]);
  });

  it("caps the list at 8 entries", () => {
    useChrome.getState().setRecentJumps([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    expect(useChrome.getState().recentJumps).toHaveLength(8);
    expect(useChrome.getState().recentJumps[0]).toBe(1);
  });

  it("clearRecentJumps empties the list", () => {
    useChrome.getState().setRecentJumps([1, 2, 3]);
    useChrome.getState().clearRecentJumps();
    expect(useChrome.getState().recentJumps).toEqual([]);
  });
});
