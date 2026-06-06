import { describe, expect, it } from "vitest";

import { IMAGE_BG_DEFAULT_DARKEN, nextBackgroundSettings } from "./backgroundMode";

describe("nextBackgroundSettings (issue 026)", () => {
  it("bumps darken to 35 when switching to image with darken=0", () => {
    expect(nextBackgroundSettings({ backgroundMode: "color", darken: 0 }, "image")).toEqual({
      backgroundMode: "image",
      darken: IMAGE_BG_DEFAULT_DARKEN,
    });
  });

  it("preserves user's existing darken value when switching to image", () => {
    expect(nextBackgroundSettings({ backgroundMode: "color", darken: 60 }, "image")).toEqual({
      backgroundMode: "image",
    });
  });

  it("does not touch darken for color or dark modes", () => {
    expect(nextBackgroundSettings({ backgroundMode: "image", darken: 0 }, "color")).toEqual({
      backgroundMode: "color",
    });
    expect(nextBackgroundSettings({ backgroundMode: "image", darken: 0 }, "dark")).toEqual({
      backgroundMode: "dark",
    });
  });
});
