import { describe, it, expect } from "vitest";

import { SHORTCUTS, matchShortcut, matchesShortcut } from "./shortcuts";

function ev(init: Partial<KeyboardEvent> & { key: string }): KeyboardEvent {
  return { code: "", metaKey: false, ctrlKey: false, altKey: false, shiftKey: false, ...init } as KeyboardEvent;
}

describe("shortcuts modifier guard (issue 030)", () => {
  it("Cmd+P does NOT match the inspector pause binding", () => {
    expect(matchShortcut(ev({ key: "p", metaKey: true }), "inspector")).toBeUndefined();
  });
  it("Ctrl+P does NOT match the inspector pause binding", () => {
    expect(matchShortcut(ev({ key: "p", ctrlKey: true }), "inspector")).toBeUndefined();
  });
  it("Plain p still matches the inspector pause binding", () => {
    const m = matchShortcut(ev({ key: "p" }), "inspector");
    expect(m?.id).toBe("inspector-toggle-timer-pause");
  });
  it("Cmd+/ does NOT trigger the help dialog", () => {
    expect(matchShortcut(ev({ key: "/", metaKey: true }), "presenter")).toBeUndefined();
  });
  it("matchesShortcut directly rejects modifier combos for every catalogued shortcut", () => {
    for (const def of SHORTCUTS) {
      if (def.keys.length === 0) continue;
      expect(matchesShortcut(ev({ key: def.keys[0], metaKey: true }), def)).toBe(false);
    }
  });
});
