import { describe, expect, it } from "vitest";

import { LINT_RULES, lintDeck } from "./lint";
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

const center: Slide = { id: "c", type: "center", title: "C", heading: ["Hello"] };
const deckOf = (slides: Slide[], overrides: Partial<Deck> = {}): Deck => ({
  id: "d", title: "T", themeId: "default",
  slides, settings: baseSettings, ...overrides,
});

const has = (deck: Deck, rule: string) =>
  lintDeck(deck).some((i) => i.rule === rule);

describe("lintDeck — batch 11 rules", () => {
  it("deck-no-theme warns when themeId is omitted", () => {
    const d = deckOf([center]);
    delete (d as { themeId?: string }).themeId;
    expect(has(d, "deck-no-theme")).toBe(true);
  });

  it("title-too-long warns when slide.title >80 chars", () => {
    const s: Slide = { ...center, id: "x", title: "x".repeat(120) };
    expect(has(deckOf([s]), "title-too-long")).toBe(true);
  });

  it("budget-too-short warns when budget <5s", () => {
    const s: Slide = { ...center, id: "x", budget: 2 };
    expect(has(deckOf([s]), "budget-too-short")).toBe(true);
  });

  it("bullets-no-bullets errors on empty bullets array", () => {
    const s: Slide = { id: "b", type: "bullets", title: "B", heading: ["H"], bullets: [] };
    expect(has(deckOf([s]), "bullets-no-bullets")).toBe(true);
  });

  it("steps-no-steps errors on empty steps array", () => {
    const s: Slide = { id: "s", type: "steps", title: "S", heading: "H", steps: [] };
    expect(has(deckOf([s]), "steps-no-steps")).toBe(true);
  });

  it("timeline-no-items errors on empty items array", () => {
    const s: Slide = { id: "t", type: "timeline", title: "T", items: [] };
    expect(has(deckOf([s]), "timeline-no-items")).toBe(true);
  });

  it("timeline-item-too-long warns when an item detail >120 chars", () => {
    const s: Slide = {
      id: "t", type: "timeline", title: "T",
      items: [{ label: "Q1", detail: ["x".repeat(150)] }],
    };
    expect(has(deckOf([s]), "timeline-item-too-long")).toBe(true);
  });

  it("poll-duplicate-option warns on duplicate option labels", () => {
    const s: Slide = {
      id: "p", type: "poll", title: "P",
      question: "?", options: ["Yes", "yes", "No"],
    };
    expect(has(deckOf([s]), "poll-duplicate-option")).toBe(true);
  });

  it("qa-not-last warns when qa isn't the last slide", () => {
    const qa: Slide = { id: "q", type: "qa", title: "Q", prompt: "Ask" };
    expect(has(deckOf([qa, center]), "qa-not-last")).toBe(true);
    expect(has(deckOf([center, qa]), "qa-not-last")).toBe(false);
  });

  it("image-src-missing errors when src is empty", () => {
    const s = { id: "i", type: "image", title: "I", src: "", alt: "x" } as unknown as Slide;
    expect(has(deckOf([s]), "image-src-missing")).toBe(true);
  });

  it("LINT_RULES catalogue includes every new rule id", () => {
    const ids = new Set(LINT_RULES.map((r) => r.id));
    for (const id of [
      "deck-no-theme", "title-too-long", "budget-too-short",
      "bullets-no-bullets", "steps-no-steps", "timeline-no-items",
      "timeline-item-too-long", "poll-duplicate-option",
      "qa-not-last", "image-src-missing",
    ]) {
      expect(ids.has(id)).toBe(true);
    }
  });
});
