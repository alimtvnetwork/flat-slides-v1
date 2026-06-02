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

import { describe as d2, expect as e2, it as i2 } from "vitest";
import { listThemes, THEMES as TH2 } from "./themes";

d2("listThemes", () => {
  i2("returns id+name for every theme", () => {
    const list = listThemes();
    e2(list.length).toBe(TH2.length);
    for (const t of list) {
      e2(typeof t.id).toBe("string");
      e2(typeof t.name).toBe("string");
    }
  });
});
