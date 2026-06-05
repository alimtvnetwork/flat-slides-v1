import { describe, it, expect } from "vitest";
import {
  pickLargestFace,
  faceToSample,
  emaStep,
  relaxToIdentity,
  frameToTransform,
  identityTransform,
  IDENTITY_FRAME,
  MAX_EXTRA_ZOOM,
  ZOOM_CEIL_FILL,
} from "./autoFrame";

describe("autoFrame pure pipeline (task 11)", () => {
  it("pickLargestFace returns the face with the biggest bounding-box area", () => {
    const faces = [
      { boundingBox: { x: 0, y: 0, width: 10, height: 10 } },
      { boundingBox: { x: 0, y: 0, width: 30, height: 30 } },
      { boundingBox: { x: 0, y: 0, width: 20, height: 20 } },
    ];
    expect(pickLargestFace(faces)?.boundingBox.width).toBe(30);
    expect(pickLargestFace([])).toBeNull();
  });

  it("faceToSample normalises to [0,1] and degenerate videos return identity", () => {
    const s = faceToSample({ x: 100, y: 50, width: 200, height: 200 }, 400, 300);
    expect(s.cx).toBeCloseTo(0.5);
    expect(s.cy).toBeCloseTo(0.5);
    expect(s.fill).toBeCloseTo(200 / 300);
    expect(faceToSample({ x: 0, y: 0, width: 1, height: 1 }, 0, 0)).toEqual({ cx: 0.5, cy: 0.5, fill: 0 });
  });

  it("emaStep moves toward the target by alpha; multiple steps converge", () => {
    let s = IDENTITY_FRAME;
    const target = { cx: 0.8, cy: 0.2, fill: 0.4 };
    for (let i = 0; i < 50; i++) s = emaStep(s, target);
    expect(s.cx).toBeCloseTo(0.8, 2);
    expect(s.cy).toBeCloseTo(0.2, 2);
  });

  it("relaxToIdentity glides back toward (0.5, 0.5, 0)", () => {
    let s = { cx: 0.9, cy: 0.1, fill: 0.5 };
    for (let i = 0; i < 60; i++) s = relaxToIdentity(s);
    expect(s.cx).toBeCloseTo(0.5, 2);
    expect(s.cy).toBeCloseTo(0.5, 2);
    expect(s.fill).toBeCloseTo(0, 2);
  });

  it("frameToTransform composes translate+scale; mirror flips X intent", () => {
    // Face on the LEFT of the unmirrored video (cx=0.2) → translate +X to
    // re-center; (0.5-0.2)*100 = 30% gets clamped down to MAX_TRANSLATE = 22%.
    const t1 = frameToTransform({ cx: 0.2, cy: 0.5, fill: 0 }, false);
    expect(t1).toMatch(/translate\(22\.00%, 0\.00%\) scale\(1\.000\)/);
    // Same raw cx in MIRRORED space: cxEff = 1-0.2 = 0.8 → translate -22%
    // (also clamped), with a trailing scaleX(-1).
    const t2 = frameToTransform({ cx: 0.2, cy: 0.5, fill: 0 }, true);
    expect(t2).toMatch(/translate\(-22\.00%, 0\.00%\) scale\(1\.000\) scaleX\(-1\)/);
  });

  it("frameToTransform saturates extra zoom at MAX_EXTRA_ZOOM for very large faces", () => {
    const t = frameToTransform({ cx: 0.5, cy: 0.5, fill: ZOOM_CEIL_FILL + 0.1 }, false);
    expect(t).toContain(`scale(${(1 + MAX_EXTRA_ZOOM).toFixed(3)})`);
  });

  it("identityTransform respects mirror", () => {
    expect(identityTransform(false)).toBe("none");
    expect(identityTransform(true)).toBe("scaleX(-1)");
  });
});
