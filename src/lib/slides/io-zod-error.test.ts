import { describe, it, expect } from "vitest";

import { parseDeckJson } from "./io";

describe("parseDeckJson — zod error formatting (issue 008)", () => {
  it("truncates the toast string to 4 issues but exposes the full list and count", () => {
    // Bad deck: missing/invalid fields produce many issues
    const raw = JSON.stringify({
      id: 1, title: 2, slides: [
        { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 },
      ],
    });
    const r = parseDeckJson(raw);
    if (r.ok) throw new Error("expected failure");
    expect(r.errorCount).toBeGreaterThan(4);
    // Short string has ≤ 4 path lines + "…and N more" suffix
    const lines = r.error.split("\n").filter((l) => !l.startsWith("…"));
    expect(lines.length).toBeLessThanOrEqual(4);
    expect(r.error).toMatch(/…and \d+ more/);
    // Full list contains every issue
    expect(r.errorFull.split("\n").length).toBe(r.errorCount);
  });

  it("invalid JSON returns errorCount 1 and identical short/full strings", () => {
    const r = parseDeckJson("{not json");
    if (r.ok) throw new Error("expected failure");
    expect(r.errorCount).toBe(1);
    expect(r.error).toBe(r.errorFull);
    expect(r.error).toMatch(/Invalid JSON/);
  });
});
