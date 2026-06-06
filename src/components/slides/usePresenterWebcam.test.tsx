import { describe, it, expect, beforeEach, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

import {
  PresenterWebcamProvider,
  usePresenterWebcam,
  readStoredPos,
  readStoredSize,
  readStoredFlag,
  readStoredPlate,
  writeStoredPos,
  writeStoredSize,
  writeStoredFlag,
  writeStoredPlate,
  describeGetUserMediaError,
  clampPos,
  freeSizeFromWidth,
  nextStep,
  SIZE_STEPS,
  DEFAULT_POS,
  DEFAULT_SIZE,
  DEFAULT_PLATE,
  SIZE_KEY,
  POS_KEY,
  MIN_KEY,
  HALO_KEY,
  CIRCLE_KEY,
  AUTOFRAME_KEY,
  PLATE_KEY,
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

describe("usePresenterWebcam overlay round-trip (task 8) + passthrough (task 9)", () => {
  beforeEach(() => localStorage.clear());

  function mountWithStream() {
    const fakeStream = { getTracks: () => [{ stop: vi.fn() }] } as unknown as MediaStream;
    // @ts-expect-error test stub
    globalThis.navigator.mediaDevices = { getUserMedia: vi.fn().mockResolvedValue(fakeStream) };
    return fakeStream;
  }

  it("enterFullscreen + restoreFromOverlay returns to exact prior phase/pos/size", async () => {
    mountWithStream();
    const { result } = renderHook(() => usePresenterWebcam(), { wrapper });
    await act(async () => { await result.current.show(); });
    act(() => result.current.setPosition({ x: 200, y: 100 }));
    act(() => result.current.setStepSize("L"));

    const priorPos = result.current.position;
    const priorSize = result.current.sizeCfg;

    act(() => result.current.enterFullscreen());
    expect(result.current.state.phase).toBe("fullscreen");

    act(() => result.current.restoreFromOverlay());
    expect(result.current.state.phase).toBe("on");
    expect(result.current.position).toEqual(priorPos);
    expect(result.current.sizeCfg).toEqual(priorSize);
  });

  it("enterStage and toggling fullscreen ↔ stage preserves the original snapshot", async () => {
    mountWithStream();
    const { result } = renderHook(() => usePresenterWebcam(), { wrapper });
    await act(async () => { await result.current.show(); });
    act(() => result.current.setStepSize("S"));
    const priorSize = result.current.sizeCfg;

    act(() => result.current.enterStage());
    expect(result.current.state.phase).toBe("stage");
    act(() => result.current.enterFullscreen()); // no re-snapshot
    expect(result.current.state.phase).toBe("fullscreen");
    act(() => result.current.restoreFromOverlay());
    expect(result.current.state.phase).toBe("on");
    expect(result.current.sizeCfg).toEqual(priorSize);
  });

  it("emitPassthrough dispatches a riseup:webcam-passthrough CustomEvent", async () => {
    const { result } = renderHook(() => usePresenterWebcam(), { wrapper });
    const handler = vi.fn();
    window.addEventListener("riseup:webcam-passthrough", handler as EventListener);
    act(() => result.current.emitPassthrough("next"));
    expect(handler).toHaveBeenCalledTimes(1);
    const ev = handler.mock.calls[0][0] as CustomEvent;
    expect(ev.detail).toEqual({ direction: "next" });
    window.removeEventListener("riseup:webcam-passthrough", handler as EventListener);
  });
});

describe("usePresenterWebcam halo / plate / autoframe persistence (tasks 11–13)", () => {
  beforeEach(() => localStorage.clear());

  it("toggleHalo flips and persists under riseup.webcam.halo", () => {
    const { result } = renderHook(() => usePresenterWebcam(), { wrapper });
    expect(result.current.halo).toBe(true); // default on
    act(() => result.current.toggleHalo());
    expect(result.current.halo).toBe(false);
    expect(localStorage.getItem("riseup.webcam.halo")).toBe("0");
  });

  it("toggleAutoFrame defaults off and persists under riseup.webcam.autoframe", () => {
    const { result } = renderHook(() => usePresenterWebcam(), { wrapper });
    expect(result.current.autoFrame).toBe(false);
    act(() => result.current.toggleAutoFrame());
    expect(result.current.autoFrame).toBe(true);
    expect(localStorage.getItem("riseup.webcam.autoframe")).toBe("1");
  });

  it("cyclePlateVariant walks none→neutral→gold→none and persists", () => {
    const { result } = renderHook(() => usePresenterWebcam(), { wrapper });
    expect(result.current.plateVariant).toBe("neutral"); // default
    act(() => result.current.cyclePlateVariant());
    expect(result.current.plateVariant).toBe("gold");
    act(() => result.current.cyclePlateVariant());
    expect(result.current.plateVariant).toBe("none");
    expect(localStorage.getItem("riseup.webcam.plate")).toBe("none");
  });

  it("toggleCircle persists and is independent of plate", () => {
    const { result } = renderHook(() => usePresenterWebcam(), { wrapper });
    expect(result.current.circle).toBe(false);
    act(() => result.current.toggleCircle());
    expect(result.current.circle).toBe(true);
    // Plate variant unchanged
    expect(result.current.plateVariant).toBe("neutral");
    expect(localStorage.getItem("riseup.webcam.circle")).toBe("1");
  });
});

describe("usePresenterWebcam step 2 — toggle / minimized / actions / nav handlers / cinematic", () => {
  beforeEach(() => localStorage.clear());

  function mountWithStream() {
    const fakeStream = { getTracks: () => [{ stop: vi.fn() }] } as unknown as MediaStream;
    // @ts-expect-error test stub
    globalThis.navigator.mediaDevices = { getUserMedia: vi.fn().mockResolvedValue(fakeStream) };
    return fakeStream;
  }

  it("toggle() shows when off and hides when on", async () => {
    mountWithStream();
    const { result } = renderHook(() => usePresenterWebcam(), { wrapper });
    await act(async () => { await result.current.toggle(); });
    expect(result.current.state.phase).toBe("on");
    await act(async () => { await result.current.toggle(); });
    expect(result.current.state.phase).toBe("tray");
  });

  it("toggleMinimized swaps to 96x96 puck and persists under riseup.webcam.min", () => {
    const { result } = renderHook(() => usePresenterWebcam(), { wrapper });
    expect(result.current.minimized).toBe(false);
    expect(result.current.size).toEqual(SIZE_STEPS.M);
    act(() => result.current.toggleMinimized());
    expect(result.current.minimized).toBe(true);
    expect(result.current.size).toEqual({ w: 96, h: 96 });
    expect(result.current.sizeStep).toBeNull();
    expect(localStorage.getItem("riseup.webcam.min")).toBe("1");
  });

  it("sizeStep exposes 'L' when stepped and null when free-resized", () => {
    const { result } = renderHook(() => usePresenterWebcam(), { wrapper });
    act(() => result.current.setStepSize("L"));
    expect(result.current.sizeStep).toBe("L");
    act(() => result.current.setFreeSize(500));
    expect(result.current.sizeStep).toBeNull();
  });

  it("toggleStage cycles on → stage → on", async () => {
    mountWithStream();
    const { result } = renderHook(() => usePresenterWebcam(), { wrapper });
    await act(async () => { await result.current.show(); });
    act(() => result.current.toggleStage());
    expect(result.current.state.phase).toBe("stage");
    act(() => result.current.toggleStage());
    expect(result.current.state.phase).toBe("on");
  });

  it("exitFullscreen is a named alias that only fires from fullscreen", async () => {
    mountWithStream();
    const { result } = renderHook(() => usePresenterWebcam(), { wrapper });
    await act(async () => { await result.current.show(); });
    act(() => result.current.exitFullscreen()); // no-op from `on`
    expect(result.current.state.phase).toBe("on");
    act(() => result.current.enterFullscreen());
    act(() => result.current.exitFullscreen());
    expect(result.current.state.phase).toBe("on");
  });

  it("registerNavHandlers + emitPassthrough invokes goNext/goPrev", () => {
    const { result } = renderHook(() => usePresenterWebcam(), { wrapper });
    const goNext = vi.fn();
    const goPrev = vi.fn();
    let unsub: () => void = () => {};
    act(() => { unsub = result.current.registerNavHandlers({ goNext, goPrev }); });
    act(() => result.current.emitPassthrough("next"));
    act(() => result.current.emitPassthrough("prev"));
    expect(goNext).toHaveBeenCalledTimes(1);
    expect(goPrev).toHaveBeenCalledTimes(1);
    act(() => unsub());
    act(() => result.current.emitPassthrough("next"));
    expect(goNext).toHaveBeenCalledTimes(1); // unsubscribed
  });

  it("runCinematicCycle flips cinematicExiting on then off after 800ms", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => usePresenterWebcam(), { wrapper });
    act(() => result.current.runCinematicCycle());
    expect(result.current.cinematicExiting).toBe(true);
    act(() => { vi.advanceTimersByTime(800); });
    expect(result.current.cinematicExiting).toBe(false);
    vi.useRealTimers();
  });
});

describe("usePresenterWebcam step 3 — storage sweep (every riseup.webcam.* key)", () => {
  beforeEach(() => localStorage.clear());

  const ALL_KEYS = [POS_KEY, MIN_KEY, SIZE_KEY, HALO_KEY, CIRCLE_KEY, AUTOFRAME_KEY, PLATE_KEY];

  it("all keys carry the riseup.webcam.* prefix", () => {
    for (const k of ALL_KEYS) expect(k.startsWith("riseup.webcam.")).toBe(true);
    expect(new Set(ALL_KEYS).size).toBe(ALL_KEYS.length); // unique
  });

  it("corrupt JSON in every key falls back to defaults without throwing", () => {
    for (const k of ALL_KEYS) localStorage.setItem(k, "{not json");
    expect(readStoredPos()).toEqual(DEFAULT_POS);
    expect(readStoredSize()).toEqual(DEFAULT_SIZE);
    // Flags treat anything non-"0"/"1" as fallback.
    expect(readStoredFlag(HALO_KEY, true)).toBe(true);
    expect(readStoredFlag(HALO_KEY, false)).toBe(false);
    expect(readStoredFlag(CIRCLE_KEY, false)).toBe(false);
    expect(readStoredFlag(AUTOFRAME_KEY, false)).toBe(false);
    expect(readStoredFlag(MIN_KEY, false)).toBe(false);
    expect(readStoredPlate()).toBe(DEFAULT_PLATE);
  });

  it("round-trips valid values for every key", () => {
    writeStoredPos({ x: 12, y: 34 });
    writeStoredSize({ kind: "free", w: 480, h: 270 });
    writeStoredFlag(HALO_KEY, false);
    writeStoredFlag(CIRCLE_KEY, true);
    writeStoredFlag(AUTOFRAME_KEY, true);
    writeStoredFlag(MIN_KEY, true);
    writeStoredPlate("gold");

    expect(readStoredPos()).toEqual({ x: 12, y: 34 });
    expect(readStoredSize()).toEqual({ kind: "free", w: 480, h: 270 });
    expect(readStoredFlag(HALO_KEY, true)).toBe(false);
    expect(readStoredFlag(CIRCLE_KEY, false)).toBe(true);
    expect(readStoredFlag(AUTOFRAME_KEY, false)).toBe(true);
    expect(readStoredFlag(MIN_KEY, false)).toBe(true);
    expect(readStoredPlate()).toBe("gold");
  });

  it("rejects garbage plate values and keeps the default", () => {
    localStorage.setItem(PLATE_KEY, "rainbow");
    expect(readStoredPlate()).toBe(DEFAULT_PLATE);
  });

  it("swallows localStorage.getItem throws (private mode) and returns fallback", () => {
    const spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError: storage disabled");
    });
    expect(readStoredPos()).toEqual(DEFAULT_POS);
    expect(readStoredSize()).toEqual(DEFAULT_SIZE);
    expect(readStoredFlag(HALO_KEY, true)).toBe(true);
    expect(readStoredPlate()).toBe(DEFAULT_PLATE);
    spy.mockRestore();
  });

  it("swallows localStorage.setItem quota errors without throwing", () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    expect(() => writeStoredPos({ x: 1, y: 2 })).not.toThrow();
    expect(() => writeStoredSize({ kind: "step", id: "S" })).not.toThrow();
    expect(() => writeStoredFlag(HALO_KEY, true)).not.toThrow();
    expect(() => writeStoredPlate("none")).not.toThrow();
    spy.mockRestore();
  });
});
