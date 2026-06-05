import { describe, it, expect, beforeEach, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

import {
  PresenterWebcamProvider,
  usePresenterWebcam,
  readStoredPos,
  readStoredSize,
  writeStoredPos,
  writeStoredSize,
  describeGetUserMediaError,
  clampPos,
  freeSizeFromWidth,
  nextStep,
  SIZE_STEPS,
  DEFAULT_POS,
  DEFAULT_SIZE,
  SIZE_KEY,
  POS_KEY,
} from "./usePresenterWebcam";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <PresenterWebcamProvider>{children}</PresenterWebcamProvider>
);

describe("usePresenterWebcam (tasks 1–3)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("starts in `off` with no stream or error", () => {
    const { result } = renderHook(() => usePresenterWebcam(), { wrapper });
    expect(result.current.state).toEqual({ phase: "off", stream: null, error: null });
  });

  it("show() requests 1280×720 video / audio:false and transitions off → requesting → on", async () => {
    const fakeStream = { getTracks: () => [{ stop: vi.fn() }] } as unknown as MediaStream;
    const getUserMedia = vi.fn().mockResolvedValue(fakeStream);
    // @ts-expect-error test stub
    globalThis.navigator.mediaDevices = { getUserMedia };

    const { result } = renderHook(() => usePresenterWebcam(), { wrapper });
    await act(async () => {
      await result.current.show();
    });

    expect(getUserMedia).toHaveBeenCalledWith({
      video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
      audio: false,
    });
    expect(result.current.state.phase).toBe("on");
    expect(result.current.state.stream).toBe(fakeStream);
  });

  it("maps NotAllowedError / NotFoundError to friendly messages and lands in `denied`", async () => {
    const denied = Object.assign(new Error("nope"), { name: "NotAllowedError" });
    // @ts-expect-error test stub
    globalThis.navigator.mediaDevices = { getUserMedia: vi.fn().mockRejectedValue(denied) };

    const { result } = renderHook(() => usePresenterWebcam(), { wrapper });
    await act(async () => {
      await result.current.show();
    });

    expect(result.current.state.phase).toBe("denied");
    expect(result.current.state.error).toMatch(/permission denied/i);

    expect(describeGetUserMediaError({ name: "NotFoundError" })).toMatch(/no camera found/i);
    expect(describeGetUserMediaError({ name: "NotReadableError" })).toMatch(/already in use/i);
  });

  it("persistence: corrupt JSON falls back to defaults instead of throwing", () => {
    localStorage.setItem(POS_KEY, "{not json");
    localStorage.setItem(SIZE_KEY, "{also not json");
    expect(readStoredPos()).toEqual(DEFAULT_POS);
    expect(readStoredSize()).toEqual(DEFAULT_SIZE);

    writeStoredPos({ x: 100, y: 200 });
    writeStoredSize({ kind: "step", id: "L" });
    expect(readStoredPos()).toEqual({ x: 100, y: 200 });
    expect(readStoredSize()).toEqual({ kind: "step", id: "L" });
  });
});

describe("usePresenterWebcam geometry (tasks 5–6)", () => {
  it("clampPos keeps bubble inside the 1920×1080 stage", () => {
    expect(clampPos({ x: -50, y: -50 }, { w: 320, h: 180 })).toEqual({ x: 0, y: 0 });
    expect(clampPos({ x: 9999, y: 9999 }, { w: 320, h: 180 })).toEqual({
      x: 1920 - 320,
      y: 1080 - 180,
    });
  });

  it("freeSizeFromWidth is 16:9 and clamped to [160,960]", () => {
    expect(freeSizeFromWidth(50)).toEqual({ w: 160, h: 90 });
    expect(freeSizeFromWidth(2000)).toEqual({ w: 960, h: 540 });
    expect(freeSizeFromWidth(400)).toEqual({ w: 400, h: 225 });
  });

  it("nextStep walks S↔M↔L↔XL and clamps at the ends", () => {
    expect(nextStep("S", -1)).toBe("S");
    expect(nextStep("S", 1)).toBe("M");
    expect(nextStep("L", 1)).toBe("XL");
    expect(nextStep("XL", 1)).toBe("XL");
  });
});

describe("usePresenterWebcam context actions (tasks 5–6)", () => {
  beforeEach(() => localStorage.clear());

  it("setPosition clamps to stage and persists", () => {
    const { result } = renderHook(() => usePresenterWebcam(), { wrapper });
    act(() => result.current.setPosition({ x: -100, y: -100 }));
    expect(result.current.position).toEqual({ x: 0, y: 0 });
    expect(readStoredPos()).toEqual({ x: 0, y: 0 });
  });

  it("stepSize walks presets and setFreeSize switches to 16:9", () => {
    const { result } = renderHook(() => usePresenterWebcam(), { wrapper });
    // default is M
    act(() => result.current.stepSize(1));
    expect(result.current.sizeCfg).toEqual({ kind: "step", id: "L" });
    expect(result.current.size).toEqual(SIZE_STEPS.L);

    act(() => result.current.setFreeSize(500));
    expect(result.current.sizeCfg).toEqual({ kind: "free", w: 500, h: 281 });
  });
});
