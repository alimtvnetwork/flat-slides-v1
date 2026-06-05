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
    let cur: ControllerAnchor = "bottom-center";
    for (let i = 0; i < CONTROLLER_ANCHOR_ORDER.length; i++) {
      seen.add(cur);
      cur = nextControllerAnchor(cur);
    }
    expect([...seen]).toEqual(["bottom-center", "bottom-right", "bottom-left", "top-right"]);
    expect(cur).toBe("bottom-center");
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

  it("keeps fullscreen anchors inside the measured presenter frame", () => {
    const s = anchorStyles("bottom-right", true);
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
