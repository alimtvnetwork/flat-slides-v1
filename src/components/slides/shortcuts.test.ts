import { describe, expect, it } from "vitest";

import { SHORTCUTS, matchesShortcut } from "./shortcuts";

const ev = (key: string): KeyboardEvent => new KeyboardEvent("keydown", { key });

describe("shortcuts", () => {
  it("matches Space/Enter as right-arrow aliases", () => {
    const def = SHORTCUTS.find((s) => s.display === "→")!;
    expect(matchesShortcut(ev(" "), def)).toBe(true);
    expect(matchesShortcut(ev("Enter"), def)).toBe(true);
    expect(matchesShortcut(ev("ArrowRight"), def)).toBe(true);
  });

  it("is case-insensitive on letter keys", () => {
    const def = SHORTCUTS.find((s) => s.display === "F")!;
    expect(matchesShortcut(ev("f"), def)).toBe(true);
    expect(matchesShortcut(ev("F"), def)).toBe(true);
  });

  it("does not match unrelated keys", () => {
    const def = SHORTCUTS.find((s) => s.display === "G")!;
    expect(matchesShortcut(ev("h"), def)).toBe(false);
  });

  it("exposes a stable Timer group containing ⌘E", () => {
    expect(SHORTCUTS.some((s) => s.group === "Timer" && s.display === "⌘E")).toBe(true);
  });
});
