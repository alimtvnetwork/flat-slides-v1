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
    const legacy = { ...baseDeck, settings: { ...baseDeck.settings, transition: "morph" as const } };
    const out = forceFadeTransition(legacy as Deck);
    expect(out.settings.transition).toBe("fade");
  });

  it("does not mutate the input deck", () => {
    const legacy = { ...baseDeck, settings: { ...baseDeck.settings, transition: "camera-zoom" as const } };
    forceFadeTransition(legacy as Deck);
    expect(legacy.settings.transition).toBe("camera-zoom");
  });
});
