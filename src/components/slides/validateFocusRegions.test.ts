import { describe, it, expect } from "vitest";

import type { Slide } from "./types";
import { validateFocusRegions } from "./validateFocusRegions";

const baseSteps: Slide = {
  id: "demo", type: "steps", title: "Demo",
  steps: [{ heading: "a" }, { heading: "b" }, { heading: "c" }],
} as unknown as Slide;

describe("validateFocusRegions (issue 024)", () => {
  it("accepts step-bound regions that resolve to a real step", () => {
    const slide = { ...baseSteps, focus: [{ x: 0, y: 0, w: 100, h: 100, step: 2 }] } as Slide;
    expect(validateFocusRegions(slide)).toEqual([]);
  });

  it("reports step indexes beyond the slide step count", () => {
    const slide = { ...baseSteps, focus: [{ x: 0, y: 0, w: 100, h: 100, step: 9 }] } as Slide;
    const errs = validateFocusRegions(slide);
    expect(errs).toHaveLength(1);
    expect(errs[0]).toMatch(/step 9 exceeds slide step count \(3\)/);
  });

  it("rejects unbound regions on step-aware slides", () => {
    const slide = { ...baseSteps, focus: [{ x: 0, y: 0, w: 100, h: 100 }] } as Slide;
    expect(validateFocusRegions(slide)[0]).toMatch(/unbound region not allowed/);
  });

  it("rejects zero or negative width/height", () => {
    const slide = { id: "x", type: "center", title: "x", focus: [{ x: 0, y: 0, w: 0, h: -5 }] } as unknown as Slide;
    expect(validateFocusRegions(slide)[0]).toMatch(/width and height must be > 0/);
  });

  it("accepts unbound regions on non-step slides", () => {
    const slide = { id: "x", type: "center", title: "x", focus: [{ x: 0, y: 0, w: 100, h: 100 }] } as unknown as Slide;
    expect(validateFocusRegions(slide)).toEqual([]);
  });
});
