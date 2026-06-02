import { describe, expect, it } from "vitest";

import { LINT_RULES, countIssues, lintDeck } from "./lint";
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
  it("does not expose the removed deck-level zoom transition rule", () => {
    expect(LINT_RULES.some((rule) => rule.id === "deck-camera-zoom")).toBe(false);
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

describe("lintDeck — B16 rules", () => {
  const quote = (id: string): Slide => ({ id, type: "quote", title: id, quote: ["hi"], attribution: "x" });

  it("flags two consecutive quote slides", () => {
    const issues = lintDeck(deckOf([quote("a"), quote("b")]));
    expect(issues.some((i) => i.rule === "consecutive-quotes")).toBe(true);
  });

  it("does NOT flag quote slides separated by another type", () => {
    const issues = lintDeck(deckOf([quote("a"), center, quote("b")]));
    expect(issues.some((i) => i.rule === "consecutive-quotes")).toBe(false);
  });

  it('flags image fit:"split" with no heading', () => {
    const s: Slide = { id: "i", type: "image", title: "I", src: "https://x/y.png", alt: "ok", fit: "split" };
    expect(lintDeck(deckOf([s])).some((i) => i.rule === "image-split-no-heading")).toBe(true);
  });

  it('does NOT flag image fit:"split" when heading present', () => {
    const s: Slide = { id: "i", type: "image", title: "I", src: "https://x/y.png", alt: "ok", fit: "split", heading: ["Hi"] };
    expect(lintDeck(deckOf([s])).some((i) => i.rule === "image-split-no-heading")).toBe(false);
  });

  it("flags markdown markers in caption", () => {
    const s: Slide = { id: "i", type: "image", title: "I", src: "https://x/y.png", alt: "ok", caption: ["**bold** text"] };
    expect(lintDeck(deckOf([s])).some((i) => i.rule === "caption-markdown")).toBe(true);
  });

  it("countIssues sums errors and warns", () => {
    const dup1: Slide = { id: "dup", type: "center", title: "A", heading: ["H"] };
    const dup2: Slide = { id: "dup", type: "center", title: "B", heading: ["H"] };
    const counts = countIssues(lintDeck(deckOf([dup1, dup2, quote("a"), quote("b")])));
    expect(counts.errors).toBeGreaterThan(0);
    expect(counts.warns).toBeGreaterThan(0);
    expect(counts.total).toBe(counts.errors + counts.warns);
  });

  it("LINT_RULES registry contains every B16 rule", () => {
    const ids = LINT_RULES.map((r) => r.id);
    expect(ids).toContain("consecutive-quotes");
    expect(ids).toContain("image-split-no-heading");
    expect(ids).toContain("caption-markdown");
  });
});

describe("lintDeck — B17 rules", () => {
  it("flags deck volume outside [0, 1]", () => {
    const deck = deckOf([center], {
      settings: { ...baseSettings, volume: 1.5 },
    });
    expect(lintDeck(deck).some((i) => i.rule === "volume-out-of-range")).toBe(true);
  });

  it("flags duplicate slide titles", () => {
    const a: Slide = { id: "a", type: "center", title: "Same", heading: ["H"] };
    const b: Slide = { id: "b", type: "center", title: "Same", heading: ["H"] };
    expect(lintDeck(deckOf([a, b])).some((i) => i.rule === "duplicate-title")).toBe(true);
  });

  it("flags invalid focus rect (w<=0) as error", () => {
    const s: Slide = {
      id: "s", type: "image", title: "I", src: "https://x/y.png", alt: "ok",
      focus: [{ x: 0, y: 0, w: 0, h: 100 }],
    };
    const hit = lintDeck(deckOf([s])).find((i) => i.rule === "focus-rect-invalid");
    expect(hit?.severity).toBe("error");
  });

  it("flags focus rect extending past 1920×1080", () => {
    const s: Slide = {
      id: "s", type: "image", title: "I", src: "https://x/y.png", alt: "ok",
      focus: [{ x: 1500, y: 500, w: 600, h: 700 }],
    };
    expect(lintDeck(deckOf([s])).some((i) => i.rule === "focus-rect-out-of-bounds")).toBe(true);
  });

  it("flags padding out of range and invalid budget", () => {
    const s: Slide = { id: "s", type: "center", title: "X", heading: ["H"], padding: 999, budget: 0 };
    const issues = lintDeck(deckOf([s]));
    expect(issues.some((i) => i.rule === "padding-out-of-range")).toBe(true);
    expect(issues.some((i) => i.rule === "budget-invalid")).toBe(true);
  });

  it("flags http:// slide backgrounds", () => {
    const s: Slide = { id: "s", type: "center", title: "X", heading: ["H"], background: "http://example.com/bg.jpg" };
    expect(lintDeck(deckOf([s])).some((i) => i.rule === "background-not-https")).toBe(true);
  });

  it("does NOT flag https or data: backgrounds", () => {
    const s: Slide = { id: "s", type: "center", title: "X", heading: ["H"], background: "https://example.com/bg.jpg" };
    expect(lintDeck(deckOf([s])).some((i) => i.rule === "background-not-https")).toBe(false);
  });

  it("flags embed slide missing url as error", () => {
    const s: Slide = { id: "e", type: "embed", title: "E", url: "" };
    const hit = lintDeck(deckOf([s])).find((i) => i.rule === "embed-missing-url");
    expect(hit?.severity).toBe("error");
  });

  it("flags left-slide media object without alt", () => {
    const s: Slide = {
      id: "l", type: "left", title: "L",
      heading: ["H"], body: ["b"],
      media: { src: "https://x/y.png" },
    };
    expect(lintDeck(deckOf([s])).some((i) => i.rule === "left-media-alt-missing")).toBe(true);
  });

  it("does NOT flag left-slide media object with alt", () => {
    const s: Slide = {
      id: "l", type: "left", title: "L",
      heading: ["H"], body: ["b"],
      media: { src: "https://x/y.png", alt: "team photo" },
    };
    expect(lintDeck(deckOf([s])).some((i) => i.rule === "left-media-alt-missing")).toBe(false);
  });

  it("LINT_RULES registry contains every B17 rule", () => {
    const ids = LINT_RULES.map((r) => r.id);
    for (const id of [
      "volume-out-of-range", "duplicate-title", "focus-rect-invalid",
      "focus-rect-out-of-bounds", "padding-out-of-range", "budget-invalid",
      "background-not-https", "embed-missing-url", "left-media-alt-missing",
    ]) {
      expect(ids).toContain(id);
    }
  });

  it("flags per-slide sound.url that is not https or absolute", () => {
    const s: Slide = { id: "c", type: "center", title: "C", heading: ["Hi"],
      sound: { url: "sounds/ding.mp3" } };
    expect(lintDeck(deckOf([s])).some((i) => i.rule === "slide-sound-url-not-https")).toBe(true);
  });

  it("flags per-slide sound.volume outside [0,1]", () => {
    const s: Slide = { id: "c", type: "center", title: "C", heading: ["Hi"],
      sound: { url: "/sounds/ding.mp3", volume: 1.5 } };
    expect(lintDeck(deckOf([s])).some((i) => i.rule === "slide-sound-volume-out-of-range")).toBe(true);
  });

  it("does NOT flag a valid per-slide sound", () => {
    const s: Slide = { id: "c", type: "center", title: "C", heading: ["Hi"],
      sound: { url: "/sounds/ding.mp3", volume: 0.5 } };
    const rules = lintDeck(deckOf([s])).map((i) => i.rule);
    expect(rules).not.toContain("slide-sound-url-not-https");
    expect(rules).not.toContain("slide-sound-volume-out-of-range");
  });
});


describe("lintDeck — consecutive-images rule", () => {
  const img = (id: string): Slide => ({ id, type: "image", title: id, src: "/x.png", alt: "x" });

  it("flags the third image in a row", () => {
    const issues = lintDeck(deckOf([img("a"), img("b"), img("c")]));
    expect(issues.some((i) => i.rule === "consecutive-images" && i.slideId === "c")).toBe(true);
  });

  it("does NOT flag two image slides in a row", () => {
    const issues = lintDeck(deckOf([img("a"), img("b")]));
    expect(issues.some((i) => i.rule === "consecutive-images")).toBe(false);
  });

  it("is documented in LINT_RULES", () => {
    expect(LINT_RULES.some((r) => r.id === "consecutive-images")).toBe(true);
  });
});
