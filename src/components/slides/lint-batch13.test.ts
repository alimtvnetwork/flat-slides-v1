import { describe, expect, it } from "vitest";

import { DECK_SCHEMA_VERSION } from "@/lib/slides/version";

import { LINT_RULES, deckHasFocus, groupIssuesByRule, lintDeck } from "./lint";
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

describe("lintDeck — batch 13 rules", () => {
  it("budget-non-integer fires on fractional budget", () => {
    expect(has(deckOf([{ ...center, id: "x", budget: 12.5 }]), "budget-non-integer")).toBe(true);
  });

  it("padding-zero-edge-align fires on padding=0 + top-left", () => {
    expect(has(deckOf([{ ...center, id: "x", padding: 0, align: "top-left" }]), "padding-zero-edge-align")).toBe(true);
  });

  it("padding-zero-edge-align does NOT fire on padding=0 + center", () => {
    expect(has(deckOf([{ ...center, id: "x", padding: 0, align: "center" }]), "padding-zero-edge-align")).toBe(false);
  });

  it("slide-id-too-long fires on >64-char id", () => {
    expect(has(deckOf([{ ...center, id: "a".repeat(80) }]), "slide-id-too-long")).toBe(true);
  });

  it("decor-on-non-content fires for code decor on quote", () => {
    const q: Slide = { id: "q", type: "quote", title: "Q", quote: ["enough chars here right"], attribution: "X", decor: "code" };
    expect(has(deckOf([q]), "decor-on-non-content")).toBe(true);
  });

  it("image-caption-too-long fires when caption >160 chars", () => {
    const s: Slide = {
      id: "i", type: "image", title: "I", src: "https://x/y.png", alt: "an image of x",
      caption: ["x".repeat(200)],
    };
    expect(has(deckOf([s]), "image-caption-too-long")).toBe(true);
  });

  it("deck-version-mismatch fires when deck.version differs from schema version", () => {
    const d = deckOf([center], { version: DECK_SCHEMA_VERSION + 99 });
    expect(has(d, "deck-version-mismatch")).toBe(true);
  });
});

describe("lint utility helpers", () => {
  it("deckHasFocus returns true when any slide has focus regions", () => {
    const a: Slide = { ...center, id: "a" };
    const b: Slide = { ...center, id: "b", focus: [{ x: 0, y: 0, w: 100, h: 100 }] };
    expect(deckHasFocus(deckOf([a]))).toBe(false);
    expect(deckHasFocus(deckOf([a, b]))).toBe(true);
  });

  it("groupIssuesByRule groups by rule id", () => {
    const issues = lintDeck(deckOf([
      { ...center, id: "x".repeat(80) },
      { ...center, id: "y".repeat(80) },
    ]));
    const grouped = groupIssuesByRule(issues);
    expect(grouped["slide-id-too-long"]?.length).toBe(2);
  });

  it("LINT_RULES catalogue includes every new rule id", () => {
    const ids = new Set(LINT_RULES.map((r) => r.id));
    for (const id of [
      "budget-non-integer", "padding-zero-edge-align", "slide-id-too-long",
      "decor-on-non-content", "image-caption-too-long", "deck-version-mismatch",
    ]) {
      expect(ids.has(id)).toBe(true);
    }
  });
});
