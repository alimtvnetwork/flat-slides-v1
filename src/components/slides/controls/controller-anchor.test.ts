import { describe, expect, it } from "vitest";

import {
  anchorStyles,
  CONTROLLER_ANCHOR_ORDER,
  nextControllerAnchor,
  type ControllerAnchor,
} from "./controller-anchor";

describe("nextControllerAnchor", () => {
  it("wraps after the last anchor", () => {
    const last = CONTROLLER_ANCHOR_ORDER[CONTROLLER_ANCHOR_ORDER.length - 1];
    expect(nextControllerAnchor(last)).toBe(CONTROLLER_ANCHOR_ORDER[0]);
  });

  it("visits all 8 anchors in one full cycle without repeats", () => {
    const seen = new Set<ControllerAnchor>();
    let cur: ControllerAnchor = "bottom-right";
    for (let i = 0; i < CONTROLLER_ANCHOR_ORDER.length; i++) {
      seen.add(cur);
      cur = nextControllerAnchor(cur);
    }
    expect(seen.size).toBe(8);
    expect(cur).toBe("bottom-right");
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

  it("centers horizontally for *-center anchors", () => {
    expect(anchorStyles("top-center").transform).toContain("translateX");
    expect(anchorStyles("bottom-center").transform).toContain("translateX");
  });

  it("centers vertically for middle-* anchors", () => {
    expect(anchorStyles("middle-left").transform).toContain("translateY");
    expect(anchorStyles("middle-right").transform).toContain("translateY");
  });

  it("falls back to bottom-right for unknown anchors", () => {
    const s = anchorStyles("nope" as unknown as ControllerAnchor);
    expect(s).toHaveProperty("bottom");
    expect(s).toHaveProperty("right");
  });
});
