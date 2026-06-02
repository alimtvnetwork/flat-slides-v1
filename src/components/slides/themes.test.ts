import { describe, expect, it } from "vitest";

import { DEFAULT_THEME_ID, getTheme, THEMES, themeStyle } from "./themes";

describe("themes", () => {
  it("default theme id resolves", () => {
    expect(getTheme(DEFAULT_THEME_ID).id).toBe(DEFAULT_THEME_ID);
  });

  it("unknown id falls back to first theme", () => {
    expect(getTheme("does-not-exist").id).toBe(THEMES[0].id);
  });

  it("print theme is high-contrast B/W for PDF export", () => {
    const print = getTheme("print");
    expect(print.id).toBe("print");
    expect(print.bg).toBe("#ffffff");
    expect(print.fg).toBe("#000000");
  });

  it("themeStyle suppresses text-shadow for dark text on light bg", () => {
    const style = themeStyle(getTheme("print")) as Record<string, string>;
    expect(style["--slide-text-shadow"]).toBe("none");
  });

  it("themeStyle applies legibility text-shadow for light text on dark bg", () => {
    const style = themeStyle(getTheme("snow")) as Record<string, string>;
    expect(style["--slide-text-shadow"]).not.toBe("none");
  });
});
