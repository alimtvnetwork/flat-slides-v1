import { describe, expect, it } from "vitest";

import { lintDeck } from "./lint";
import type { Deck, Slide } from "./types";

const baseSettings: Deck["settings"] = {
  backgroundMode: "color",
  backgroundColor: "#0b0b12",
  darken: 0,
  blur: 0,
  transition: "fade",
  soundEnabled: true,
  volume: 0.6,
};

const deckOf = (slides: Slide[], overrides: Partial<Deck> = {}): Deck => ({
  id: "test-deck",
  title: "Test",
  slides,
  settings: baseSettings,
  ...overrides,
});

const center: Slide = { id: "c", type: "center", title: "C", heading: ["Hello"] };

describe("lintDeck — new spec rules", () => {
  it("flags deck-level camera-zoom transition", () => {
    const deck = deckOf([center], {
      settings: { ...baseSettings, transition: "camera-zoom" },
    });
    const issues = lintDeck(deck);
    expect(issues.some((i) => i.rule === "deck-camera-zoom")).toBe(true);
  });

  it("does NOT flag deck-level fade transition", () => {
    expect(lintDeck(deckOf([center])).some((i) => i.rule === "deck-camera-zoom")).toBe(false);
  });

  it("flags focus regions on bullets / quote / timeline", () => {
    const bullets: Slide = {
      id: "b", type: "bullets", title: "B",
      heading: ["H"], bullets: [["one"]],
      focus: [{ x: 0, y: 0, w: 100, h: 100 }],
    };
    const quote: Slide = {
      id: "q", type: "quote", title: "Q",
      quote: ["hi"], attribution: "x",
      focus: [{ x: 0, y: 0, w: 100, h: 100 }],
    };
    const timeline: Slide = {
      id: "t", type: "timeline", title: "T",
      items: [
        { label: "Q1", detail: ["a"] },
        { label: "Q2", detail: ["b"] },
      ],
      focus: [{ x: 0, y: 0, w: 100, h: 100 }],
    };
    const issues = lintDeck(deckOf([bullets, quote, timeline]));
    const focusRule = issues.filter((i) => i.rule === "focus-on-list");
    expect(focusRule).toHaveLength(3);
  });

  it("does NOT flag focus regions on steps / image / left", () => {
    const steps: Slide = {
      id: "s", type: "steps", title: "S",
      heading: "H", steps: [{ label: "1", detail: ["x"] }],
      focus: [{ x: 0, y: 0, w: 100, h: 100 }],
    };
    expect(lintDeck(deckOf([steps])).some((i) => i.rule === "focus-on-list")).toBe(false);
  });

  it("flags base64 images larger than ~200 KB", () => {
    const big = "data:image/png;base64," + "A".repeat(300_000);
    const img: Slide = { id: "i", type: "image", title: "I", src: big, alt: "x" };
    const issues = lintDeck(deckOf([img]));
    expect(issues.some((i) => i.rule === "base64-image-large")).toBe(true);
  });

  it("does NOT flag small base64 or hosted URLs", () => {
    const small: Slide = {
      id: "s", type: "image", title: "S",
      src: "data:image/png;base64,AAAA", alt: "x",
    };
    const hosted: Slide = {
      id: "h", type: "image", title: "H",
      src: "https://example.com/" + "x".repeat(400_000), alt: "x",
    };
    const issues = lintDeck(deckOf([small, hosted]));
    expect(issues.some((i) => i.rule === "base64-image-large")).toBe(false);
  });
});

describe("lintDeck — B14 rules", () => {
  it("flags filename-looking alt text", () => {
    const img: Slide = { id: "i", type: "image", title: "I", src: "https://x/y.png", alt: "hero.png" };
    expect(lintDeck(deckOf([img])).some((i) => i.rule === "image-alt-filename")).toBe(true);
  });

  it("does NOT flag descriptive alt text", () => {
    const img: Slide = { id: "i", type: "image", title: "I", src: "https://x/y.png", alt: "Team standing on a rooftop" };
    expect(lintDeck(deckOf([img])).some((i) => i.rule === "image-alt-filename")).toBe(false);
  });

  it("flags steps slide with SVG background but no focus regions", () => {
    const s: Slide = {
      id: "s", type: "steps", title: "S",
      heading: "H", steps: [{ label: "1", detail: ["x"] }],
      background: "data:image/svg+xml;utf8,<svg/>",
    } as Slide;
    expect(lintDeck(deckOf([s])).some((i) => i.rule === "steps-svg-no-focus")).toBe(true);
  });

  it("does NOT flag steps slide with SVG background AND focus regions", () => {
    const s: Slide = {
      id: "s", type: "steps", title: "S",
      heading: "H", steps: [{ label: "1", detail: ["x"] }],
      background: "data:image/svg+xml;utf8,<svg/>",
      focus: [{ x: 0, y: 0, w: 100, h: 100, step: 1 }],
    } as Slide;
    expect(lintDeck(deckOf([s])).some((i) => i.rule === "steps-svg-no-focus")).toBe(false);
  });

  it("flags non-https embed URLs as errors", () => {
    const e: Slide = { id: "e", type: "embed", title: "E", url: "http://example.com/frame" };
    const issues = lintDeck(deckOf([e]));
    const hit = issues.find((i) => i.rule === "embed-not-https");
    expect(hit?.severity).toBe("error");
  });

  it("does NOT flag https embed URLs", () => {
    const e: Slide = { id: "e", type: "embed", title: "E", url: "https://example.com/frame" };
    expect(lintDeck(deckOf([e])).some((i) => i.rule === "embed-not-https")).toBe(false);
  });
});
