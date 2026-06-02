import { renderHook } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { useAutoFrame } from "./useAutoFrame";

describe("useAutoFrame", () => {
  beforeEach(() => {
    // Ensure FaceDetector is absent by default.
    delete (window as unknown as { FaceDetector?: unknown }).FaceDetector;
  });
  afterEach(() => {
    delete (window as unknown as { FaceDetector?: unknown }).FaceDetector;
  });

  it("reports unsupported when FaceDetector is missing", () => {
    const { result } = renderHook(() => {
      const ref = useRef<HTMLVideoElement | null>(null);
      return useAutoFrame(ref, true);
    });
    expect(result.current.supported).toBe(false);
    expect(result.current.active).toBe(false);
    expect(result.current.objectPosition).toBe("50% 50%");
  });

  it("is inactive when enabled=false even if supported", () => {
    (window as unknown as { FaceDetector: unknown }).FaceDetector = class {
      detect() { return Promise.resolve([]); }
    };
    const { result } = renderHook(() => {
      const ref = useRef<HTMLVideoElement | null>(null);
      return useAutoFrame(ref, false);
    });
    expect(result.current.supported).toBe(true);
    expect(result.current.active).toBe(false);
  });
});
