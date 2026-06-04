import { describe, expect, it, vi } from "vitest";

import * as fs from "./useFullscreen";

describe("presenter window URL", () => {
  it("appends ?present=1 so the new top-level window auto-prompts fullscreen", () => {
    const spy = vi.spyOn(window, "location", "get").mockReturnValue({
      href: "http://localhost/slides/3",
    } as Location);
    const url = new URL(fs.getPresenterWindowUrl());
    expect(url.pathname).toBe("/slides/3");
    expect(url.searchParams.get("present")).toBe("1");
    spy.mockRestore();
  });

  it("preserves existing query params alongside present=1", () => {
    const spy = vi.spyOn(window, "location", "get").mockReturnValue({
      href: "http://localhost/slides/3?session=abc",
    } as Location);
    const url = new URL(fs.getPresenterWindowUrl());
    expect(url.searchParams.get("session")).toBe("abc");
    expect(url.searchParams.get("present")).toBe("1");
    spy.mockRestore();
  });

  it("can build the presenter URL from an explicit href without reading window.location", () => {
    const url = new URL(fs.getPresenterWindowUrl("http://localhost/slides/5/2?session=abc"));
    expect(url.pathname).toBe("/slides/5/2");
    expect(url.searchParams.get("session")).toBe("abc");
    expect(url.searchParams.get("present")).toBe("1");
  });
});
