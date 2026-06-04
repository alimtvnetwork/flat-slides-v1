import { afterEach, describe, expect, it } from "vitest";

import { getPresenterWindowUrl } from "./useFullscreen";

const ORIGINAL_HREF = "http://localhost/slides/3";

describe("presenter window URL", () => {
  afterEach(() => {
    window.history.replaceState({}, "", ORIGINAL_HREF);
  });

  it("appends ?present=1 so the new top-level window auto-prompts fullscreen", () => {
    window.history.replaceState({}, "", ORIGINAL_HREF);
    const url = new URL(getPresenterWindowUrl());
    expect(url.pathname).toBe("/slides/3");
    expect(url.searchParams.get("present")).toBe("1");
  });

  it("preserves existing query params alongside present=1", () => {
    window.history.replaceState({}, "", "http://localhost/slides/3?session=abc");
    const url = new URL(getPresenterWindowUrl());
    expect(url.searchParams.get("session")).toBe("abc");
    expect(url.searchParams.get("present")).toBe("1");
  });
});
