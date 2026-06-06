import { describe, expect, it } from "vitest";

import { getActiveFocusRegion } from "./types";
import type { Slide } from "./types";

const slide = (focus: Slide["focus"]): Slide => ({
  id: "s", type: "steps", title: "S",
  heading: "H", steps: [{ label: "1", detail: ["x"] }],
  focus,
});

describe("getActiveFocusRegion", () => {
  it("returns null when there are no regions", () => {
    expect(getActiveFocusRegion(slide(undefined), 1)).toBeNull();
    expect(getActiveFocusRegion(slide([]), 1)).toBeNull();
  });

  it("ignores unbound regions on step-aware slides", () => {
    const r = { x: 0, y: 0, w: 100, h: 100, label: "all" };
    expect(getActiveFocusRegion(slide([r]), 5)).toBeNull();
  });

  it("step-bound region wins over unbound on the same step", () => {
    const regions = [
      { x: 0, y: 0, w: 100, h: 100, label: "all" },
      { x: 0, y: 0, w: 200, h: 200, label: "step-2", step: 2 },
    ];
    expect(getActiveFocusRegion(slide(regions), 2)?.label).toBe("step-2");
    expect(getActiveFocusRegion(slide(regions), 1)).toBeNull();
  });

  it("returns null when only other steps are bound and there is no unbound fallback", () => {
    const regions = [{ x: 0, y: 0, w: 100, h: 100, label: "step-3", step: 3 }];
    expect(getActiveFocusRegion(slide(regions), 1)).toBeNull();
  });
});
