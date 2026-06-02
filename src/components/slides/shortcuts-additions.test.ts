import { describe, expect, it } from "vitest";

import { SHORTCUTS } from "./shortcuts";

describe("SHORTCUTS additions", () => {
  it("documents the N key for presenter notes", () => {
    const n = SHORTCUTS.find((s) => s.display === "N");
    expect(n).toBeDefined();
    expect(n?.label.toLowerCase()).toContain("notes");
    expect(n?.keys).toContain("n");
  });

  it("documents the cmd+shift+L lint shortcut", () => {
    const lint = SHORTCUTS.find((s) => s.display === "⌘⇧L");
    expect(lint).toBeDefined();
    expect(lint?.label.toLowerCase()).toContain("lint");
  });
});
