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

describe("lintDeck — B15 rules", () => {
  it("flags duplicate slide ids as error", () => {
    const a: Slide = { id: "dup", type: "center", title: "A", heading: ["H"] };
    const b: Slide = { id: "dup", type: "center", title: "B", heading: ["H"] };
    const issues = lintDeck(deckOf([a, b]));
    const hit = issues.find((i) => i.rule === "duplicate-id");
    expect(hit?.severity).toBe("error");
  });

  it("flags focus regions with step out of range", () => {
    const s: Slide = {
      id: "s", type: "steps", title: "S",
      heading: "H", steps: [{ label: "1", detail: ["x"] }, { label: "2", detail: ["y"] }],
      focus: [{ x: 0, y: 0, w: 10, h: 10, step: 5 }],
    };
    expect(lintDeck(deckOf([s])).some((i) => i.rule === "focus-step-out-of-range")).toBe(true);
  });

  it("does NOT flag focus regions with valid step", () => {
    const s: Slide = {
      id: "s", type: "steps", title: "S",
      heading: "H", steps: [{ label: "1", detail: ["x"] }, { label: "2", detail: ["y"] }],
      focus: [{ x: 0, y: 0, w: 10, h: 10, step: 2 }],
    };
    expect(lintDeck(deckOf([s])).some((i) => i.rule === "focus-step-out-of-range")).toBe(false);
  });

  it("flags left slide missing body and heading", () => {
    const s: Slide = { id: "l", type: "left", title: "L", heading: [] };
    const issues = lintDeck(deckOf([s]));
    expect(issues.some((i) => i.rule === "body-empty")).toBe(true);
    expect(issues.some((i) => i.rule === "heading-empty")).toBe(true);
  });

  it("flags poll with <2 options and missing question", () => {
    const s: Slide = { id: "p", type: "poll", title: "P", question: "", options: ["only"] };
    const issues = lintDeck(deckOf([s]));
    expect(issues.some((i) => i.rule === "poll-no-question")).toBe(true);
    expect(issues.some((i) => i.rule === "poll-too-few-options")).toBe(true);
  });

  it("flags poll with >6 options as warn", () => {
    const s: Slide = {
      id: "p", type: "poll", title: "P", question: "Q?",
      options: ["a", "b", "c", "d", "e", "f", "g"],
    };
    expect(lintDeck(deckOf([s])).some((i) => i.rule === "poll-too-many-options")).toBe(true);
  });

  it("flags qa slide with empty prompt", () => {
    const s: Slide = { id: "q", type: "qa", title: "Q" };
    expect(lintDeck(deckOf([s])).some((i) => i.rule === "qa-no-prompt")).toBe(true);
  });
});
