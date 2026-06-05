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
    musicVolume: 40,
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

  it("preserves explicit opt-in camera zoom", () => {
    const zoom = { ...baseDeck, settings: { ...baseDeck.settings, transition: "camera-zoom" } } as Deck;
    expect(forceFadeTransition(zoom)).toBe(zoom);
  });

  it("does not mutate the input deck", () => {
    const legacy = { ...baseDeck, settings: { ...baseDeck.settings, transition: "camera-zoom" } } as unknown as Deck;
    forceFadeTransition(legacy);
    expect((legacy.settings as unknown as { transition: string }).transition).toBe("camera-zoom");
  });

  it("repairs the persisted bundled focus demo rectangle that could not visibly zoom", () => {
    const persisted = {
      ...baseDeck,
      slides: [
        {
          id: "focus-demo",
          type: "steps",
          title: "Focus Regions Demo",
          heading: "Camera focus regions",
          steps: [
            { label: "Step 1", detail: ["One"] },
            { label: "Step 2", detail: ["Two"] },
          ],
          focus: [{ step: 2, x: 80, y: 80, w: 760, h: 920, duration: 700, label: "Label column" }],
        },
      ],
    } as Deck;

    const repaired = forceFadeTransition(persisted);
    expect(repaired.slides[0].focus?.[0]).toMatchObject({ step: 2, x: 80, y: 180, w: 760, h: 640 });
    expect(persisted.slides[0].focus?.[0]).toMatchObject({ y: 80, h: 920 });
  });
});
