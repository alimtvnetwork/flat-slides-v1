import { describe, expect, it } from "vitest";

import {
  getActiveFocusRegion,
  getDisplayNumber,
  slideStepCount,
  type Slide,
} from "./types";

const baseCenter: Slide = {
  id: "x",
  type: "center",
  title: "X",
  heading: ["X"],
};

describe("slideStepCount", () => {
  it("returns 0 for non-stepped slides", () => {
    expect(slideStepCount(baseCenter)).toBe(0);
  });

  it("counts steps for steps slides", () => {
    const s: Slide = {
      id: "s",
      type: "steps",
      title: "S",
      heading: "S",
      steps: [
        { label: "1", detail: ["a"] },
        { label: "2", detail: ["b"] },
        { label: "3", detail: ["c"] },
      ],
    };
    expect(slideStepCount(s)).toBe(3);
  });

  it("counts items for timeline slides", () => {
    const s: Slide = {
      id: "t",
      type: "timeline",
      title: "T",
      items: [{ label: "Q1" }, { label: "Q2" }],
    };
    expect(slideStepCount(s)).toBe(2);
  });
});

describe("getDisplayNumber", () => {
  it("prefers authored number over linear position", () => {
    expect(getDisplayNumber({ ...baseCenter, number: 7 }, 3)).toBe(7);
  });
  it("falls back to linear position when unauthored", () => {
    expect(getDisplayNumber(baseCenter, 4)).toBe(4);
  });
});

describe("getActiveFocusRegion", () => {
  const slide: Slide = {
    ...baseCenter,
    focus: [
      { x: 0, y: 0, w: 100, h: 100 }, // unbound default
      { x: 200, y: 200, w: 100, h: 100, step: 2 },
    ],
  };
  it("returns step-bound region when step matches", () => {
    expect(getActiveFocusRegion(slide, 2)?.x).toBe(200);
  });
  it("falls back to unbound region", () => {
    expect(getActiveFocusRegion(slide, 99)?.x).toBe(0);
  });
  it("returns null when no regions", () => {
    expect(getActiveFocusRegion(baseCenter, 1)).toBeNull();
  });
});
