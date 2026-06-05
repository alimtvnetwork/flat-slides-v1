import { describe, expect, it } from "vitest";

import { resolveInspectorModel } from "./presenterInspectorModel";
import type { Slide } from "./types";

function center(id: string, overrides: Partial<Slide> = {}): Slide {
  return {
    id,
    type: "center",
    title: `Title ${id}`,
    notes: `  notes-${id}  `,
    ...overrides,
  } as Slide;
}

function steps(id: string, count: number): Slide {
  return {
    id,
    type: "steps",
    title: `Steps ${id}`,
    steps: Array.from({ length: count }, (_, i) => ({ text: `s${i}` })),
  } as unknown as Slide;
}

const deck = (): Slide[] => [
  center("a"),
  center("b", { enabled: false }),
  center("c"),
  steps("d", 3),
];

describe("resolveInspectorModel", () => {
  it("returns null for out-of-range slide numbers", () => {
    expect(resolveInspectorModel(deck(), "0")).toBeNull();
    expect(resolveInspectorModel(deck(), "99")).toBeNull();
    expect(resolveInspectorModel(deck(), "nope")).toBeNull();
  });

  it("uses 1-based slide numbers and skips disabled slides", () => {
    const model = resolveInspectorModel(deck(), "1");
    expect(model?.slide.id).toBe("a");
    expect(model?.nextSlide?.id).toBe("c");
    expect(model?.totalSlides).toBe(3);
    expect(model?.slideNumber).toBe(1);
    expect(model?.notes).toBe("notes-a");
  });

  it("clamps step into [0..count-1] and formats label", () => {
    const high = resolveInspectorModel(deck(), "3", "99");
    expect(high?.stepIndex).toBe(2);
    expect(high?.stepLabel).toBe("Step 3/3");

    const low = resolveInspectorModel(deck(), "3", "0");
    expect(low?.stepIndex).toBe(0);
    expect(low?.stepLabel).toBe("Step 1/3");
  });

  it("defaults step to first when omitted or invalid", () => {
    const fallback = resolveInspectorModel(deck(), "1");
    expect(fallback?.stepIndex).toBe(0);
    expect(fallback?.stepLabel).toBe("Step 1/1");

    const bad = resolveInspectorModel(deck(), "3", "abc");
    expect(bad?.stepIndex).toBe(0);
  });
});
