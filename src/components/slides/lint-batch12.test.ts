import { describe, expect, it } from "vitest";

import { LINT_RULES, deckRuntimeSeconds, lintDeck } from "./lint";
import type { Deck, Slide } from "./types";

const baseSettings: Deck["settings"] = {
  backgroundMode: "color",
  backgroundColor: "#0b0b12",
  darken: 0,
  blur: 0,
  transition: "fade",
  soundEnabled: true,
  volume: 0.6,
  musicVolume: 40,
};

const center: Slide = { id: "c", type: "center", title: "C", heading: ["Hello"] };
const deckOf = (slides: Slide[], overrides: Partial<Deck> = {}): Deck => ({
  id: "d", title: "T", themeId: "default",
  slides, settings: baseSettings, ...overrides,
});

const has = (deck: Deck, rule: string) =>
  lintDeck(deck).some((i) => i.rule === rule);

describe("lintDeck — batch 12 rules", () => {
  it("darken-out-of-range fires when settings.darken > 1", () => {
    expect(has(deckOf([center], { settings: { ...baseSettings, darken: 2 } }), "darken-out-of-range")).toBe(true);
  });

  it("blur-out-of-range fires when settings.blur < 0", () => {
    expect(has(deckOf([center], { settings: { ...baseSettings, blur: -0.5 } }), "blur-out-of-range")).toBe(true);
  });

  it("backgroundColor-not-hex fires on non-hex color value", () => {
    expect(has(deckOf([center], { settings: { ...baseSettings, backgroundColor: "rebeccapurple" } }), "backgroundColor-not-hex")).toBe(true);
  });

  it("slide-number-negative fires on negative number", () => {
    const s: Slide = { ...center, id: "x", number: -3 };
    expect(has(deckOf([s]), "slide-number-negative")).toBe(true);
  });

  it("theme-consecutive-redundant fires when two adjacent slides override same theme", () => {
    const a: Slide = { ...center, id: "a", themeId: "midnight" };
    const b: Slide = { ...center, id: "b", themeId: "midnight" };
    expect(has(deckOf([a, b]), "theme-consecutive-redundant")).toBe(true);
  });

  it("notes-too-long fires on >500-char notes", () => {
    const s: Slide = { ...center, id: "n", notes: "x".repeat(600) };
    expect(has(deckOf([s]), "notes-too-long")).toBe(true);
  });

  it("focus-step-duplicate fires on two focus regions for the same step", () => {
    const s: Slide = {
      id: "s", type: "steps", title: "S", heading: "H",
      steps: [{ label: "1", detail: ["x"] }, { label: "2", detail: ["y"] }],
      focus: [
        { x: 0, y: 0, w: 100, h: 100, step: 1 },
        { x: 100, y: 100, w: 200, h: 200, step: 1 },
      ],
    };
    expect(has(deckOf([s]), "focus-step-duplicate")).toBe(true);
  });

  it("focus-step-duplicate does NOT fire when steps differ", () => {
    const s: Slide = {
      id: "s", type: "steps", title: "S", heading: "H",
      steps: [{ label: "1", detail: ["x"] }, { label: "2", detail: ["y"] }],
      focus: [
        { x: 0, y: 0, w: 100, h: 100, step: 1 },
        { x: 100, y: 100, w: 200, h: 200, step: 2 },
      ],
    };
    expect(has(deckOf([s]), "focus-step-duplicate")).toBe(false);
  });

  it("deckRuntimeSeconds sums positive budgets and ignores invalid", () => {
    const a: Slide = { ...center, id: "a", budget: 30 };
    const b: Slide = { ...center, id: "b", budget: 90 };
    const c: Slide = { ...center, id: "c", budget: -10 };
    expect(deckRuntimeSeconds(deckOf([a, b, c]))).toBe(120);
  });

  it("LINT_RULES catalogue includes every new rule id", () => {
    const ids = new Set(LINT_RULES.map((r) => r.id));
    for (const id of [
      "darken-out-of-range", "blur-out-of-range", "backgroundColor-not-hex",
      "slide-number-negative", "theme-consecutive-redundant",
      "notes-too-long", "focus-step-duplicate",
    ]) {
      expect(ids.has(id)).toBe(true);
    }
  });
});
