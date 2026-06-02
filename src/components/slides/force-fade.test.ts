import { describe, expect, it } from "vitest";

import { forceFadeTransition } from "./store";
import type { Deck } from "./types";

const baseDeck: Deck = {
  id: "d",
  title: "t",
  slides: [],
  settings: {
    backgroundMode: "color",
    backgroundColor: "#000",
    darken: 0,
    blur: 0,
    transition: "fade",
    soundEnabled: true,
    volume: 0.5,
  },
};

describe("forceFadeTransition", () => {
  it("returns the same deck reference when already fade", () => {
    expect(forceFadeTransition(baseDeck)).toBe(baseDeck);
  });

  it("rewrites a legacy transition to fade", () => {
    const legacy = { ...baseDeck, settings: { ...baseDeck.settings, transition: "morph" } } as unknown as Deck;
    const out = forceFadeTransition(legacy);
    expect(out.settings.transition).toBe("fade");
  });

  it("does not mutate the input deck", () => {
    const legacy = { ...baseDeck, settings: { ...baseDeck.settings, transition: "camera-zoom" } } as unknown as Deck;
    forceFadeTransition(legacy);
    expect((legacy.settings as unknown as { transition: string }).transition).toBe("camera-zoom");
  });
});
