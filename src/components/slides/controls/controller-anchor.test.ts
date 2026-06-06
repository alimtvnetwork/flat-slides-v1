import { describe, expect, it } from "vitest";

import {
  anchorStyles,
  CONTROLLER_ANCHOR_ORDER,
  isControllerAnchorShortcut,
  nextControllerAnchor,
  type ControllerAnchor,
} from "./controller-anchor";
import { CONTROLLER_ANCHOR_STORAGE_KEY, cycleControllerAnchor, useControllerAnchor } from "./controller-anchor-store";

describe("nextControllerAnchor", () => {
  it("wraps after the last anchor", () => {
    const last = CONTROLLER_ANCHOR_ORDER[CONTROLLER_ANCHOR_ORDER.length - 1];
    expect(nextControllerAnchor(last)).toBe(CONTROLLER_ANCHOR_ORDER[0]);
  });

  it("visits the B21 controller anchors in order without repeats", () => {
    const seen = new Set<ControllerAnchor>();
    let cur: ControllerAnchor = "top-right";
    for (let i = 0; i < CONTROLLER_ANCHOR_ORDER.length; i++) {
      seen.add(cur);
      cur = nextControllerAnchor(cur);
    }
    expect([...seen]).toEqual(["top-right", "bottom-right", "bottom-center", "bottom-left"]);
    expect(cur).toBe("top-right");
  });
});

describe("anchorStyles", () => {
  it("uses bottom+right insets for the default bottom-right anchor", () => {
    const s = anchorStyles("bottom-right");
    expect(s).toHaveProperty("bottom");
    expect(s).toHaveProperty("right");
    expect(s).not.toHaveProperty("top");
    expect(s).not.toHaveProperty("left");
  });

  it("centers horizontally for bottom-center", () => {
    expect(anchorStyles("bottom-center").transform).toContain("translateX");
  });

  it("keeps anchors inside the measured presenter frame even before native fullscreen", () => {
    const s = anchorStyles("bottom-right");
    expect(s.bottom).toContain("--presenter-frame-bottom");
    expect(s.right).toContain("--presenter-frame-right");
  });

  it("falls back to bottom-right for unknown anchors", () => {
    const s = anchorStyles("nope" as unknown as ControllerAnchor);
    expect(s).toHaveProperty("bottom");
    expect(s).toHaveProperty("right");
  });
});

describe("controller anchor persistence", () => {
  it("cycles with the B shortcut and persists under the required key", () => {
    localStorage.clear();
    useControllerAnchor.getState().setAnchor("bottom-center");
    expect(isControllerAnchorShortcut(new KeyboardEvent("keydown", { key: "b" }))).toBe(true);
    cycleControllerAnchor();
    expect(useControllerAnchor.getState().anchor).toBe("bottom-right");
    expect(localStorage.getItem(CONTROLLER_ANCHOR_STORAGE_KEY)).toContain("bottom-right");
  });
});

import { clampControllerAnchor } from "./controller-anchor";

describe("clampControllerAnchor (issue 029)", () => {
  it("keeps the anchor when the pill fits at the corner", () => {
    expect(clampControllerAnchor("bottom-right", 1280, 480)).toBe("bottom-right");
    expect(clampControllerAnchor("top-right", 1024, 360)).toBe("top-right");
  });

  it("snaps to bottom-center when the corner anchor would overflow", () => {
    // 480px pill + 16px inset on both sides = 512px required.
    expect(clampControllerAnchor("bottom-right", 500, 480)).toBe("bottom-center");
    expect(clampControllerAnchor("bottom-left", 320, 480)).toBe("bottom-center");
    expect(clampControllerAnchor("top-right", 360, 480)).toBe("bottom-center");
  });

  it("is a no-op for bottom-center", () => {
    expect(clampControllerAnchor("bottom-center", 320, 480)).toBe("bottom-center");
  });
});
