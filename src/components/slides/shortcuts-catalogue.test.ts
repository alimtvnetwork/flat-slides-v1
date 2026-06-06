import { describe, expect, it } from "vitest";

import { SHORTCUTS } from "./shortcuts";

describe("SHORTCUTS catalogue", () => {
  it("documents Esc as a generic panel/dialog close", () => {
    const escClose = SHORTCUTS.find(
      (s) => s.display === "Esc" && /close.*panel/i.test(s.label),
    );
    expect(escClose).toBeTruthy();
    expect(escClose?.group).toBe("Surfaces");
  });

  it("documents the N presenter-notes toggle", () => {
    const n = SHORTCUTS.find((s) => s.keys.includes("n"));
    expect(n?.label).toMatch(/presenter notes/i);
  });

  it("does not double-bind Escape in presenter key aliases", () => {
    const bound = SHORTCUTS.filter((s) => s.scope !== "inspector" && s.keys.includes("Escape"));
    expect(bound.length).toBeLessThanOrEqual(1);
  });
});
