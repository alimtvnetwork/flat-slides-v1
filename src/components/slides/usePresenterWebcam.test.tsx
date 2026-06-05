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
