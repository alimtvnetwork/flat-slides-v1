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
    // Look up by stable id, not display string (display was renamed to "F / F5"
    // when F5 was added as an alias). RCA: pre-existing crash on `def.keys`.
    const def = SHORTCUTS.find((s) => s.id === "fullscreen-toggle")!;
    expect(matchesShortcut(ev("f"), def)).toBe(true);
    expect(matchesShortcut(ev("F"), def)).toBe(true);
  });

  it("does not match unrelated keys", () => {
    const def = SHORTCUTS.find((s) => s.id === "fullscreen-toggle")!;
    expect(matchesShortcut(ev("h"), def)).toBe(false);
  });

  it("guards against undefined defs so a missing SHORTCUT id can never crash the keymap", () => {
    // Regression: shortcuts.ts:135 used to crash with "Cannot read 'keys' of undefined"
    // when callers passed a `.find(...)` result without `!`. The guard returns false instead.
    expect(matchesShortcut(ev("f"), undefined as unknown as (typeof SHORTCUTS)[number])).toBe(false);
  });

  it("exposes a stable Timer group containing ⌘E", () => {
    expect(SHORTCUTS.some((s) => s.group === "Timer" && s.display === "⌘E")).toBe(true);
  });
});
