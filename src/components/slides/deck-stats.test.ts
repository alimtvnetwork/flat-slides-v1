import { describe, expect, it } from "vitest";

import { deckStats } from "./lint";
import type { Deck, Slide } from "./types";

const settings: Deck["settings"] = {
  backgroundMode: "color", backgroundColor: "#000", darken: 0, blur: 0,
  transition: "fade", soundEnabled: true, volume: 0.5, musicVolume: 40,
};

const slide = (id: string, type: Slide["type"]): Slide => {
  switch (type) {
    case "center": return { id, type, title: id, heading: ["x"] };
    case "qa": return { id, type, title: id, prompt: "?" };
    case "image": return { id, type, title: id, src: "/x.png", alt: "x" };
    default: return { id, type: "center", title: id, heading: ["x"] };
  }
};

describe("deckStats", () => {
  it("returns zero totals for an empty deck", () => {
    const deck: Deck = { id: "d", title: "t", slides: [], settings };
    expect(deckStats(deck)).toEqual({ total: 0, byType: {}, withFocus: 0, withBackground: 0 });
  });

  it("counts by slide type", () => {
    const deck: Deck = {
      id: "d", title: "t",
      slides: [slide("a", "center"), slide("b", "image"), slide("c", "image"), slide("d", "qa")],
      settings,
    };
    const stats = deckStats(deck);
    expect(stats.total).toBe(4);
    expect(stats.byType.image).toBe(2);
    expect(stats.byType.center).toBe(1);
    expect(stats.byType.qa).toBe(1);
  });

  it("counts focus + background presence", () => {
    const s1: Slide = { id: "a", type: "center", title: "a", heading: ["x"],
      focus: [{ x: 0, y: 0, w: 100, h: 100 }], background: "https://x/y.jpg" };
    const s2: Slide = { id: "b", type: "center", title: "b", heading: ["x"] };
    const deck: Deck = { id: "d", title: "t", slides: [s1, s2], settings };
    const stats = deckStats(deck);
    expect(stats.withFocus).toBe(1);
    expect(stats.withBackground).toBe(1);
  });
});
