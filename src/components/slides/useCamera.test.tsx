import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCamera } from "./useCamera";

function stubGetUserMedia(getUserMedia: ReturnType<typeof vi.fn>) {
  Object.defineProperty(globalThis.navigator, "mediaDevices", {
    configurable: true,
    value: { getUserMedia },
  });
}

describe("useCamera lifecycle", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("requests the spec 1280×720 stream with audio disabled", async () => {
    const fakeStream = { getTracks: () => [] } as unknown as MediaStream;
    const getUserMedia = vi.fn().mockResolvedValue(fakeStream);
    stubGetUserMedia(getUserMedia);

    const { result } = renderHook(() => useCamera());
    await act(async () => {
      await result.current.start();
    });

    expect(getUserMedia).toHaveBeenCalledWith({
      video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
      audio: false,
    });
    expect(result.current.status).toBe("active");
  });

  it("soft hide keeps tracks alive; hard close stops them", async () => {
    const stop = vi.fn();
    const fakeStream = { getTracks: () => [{ stop }] } as unknown as MediaStream;
    const getUserMedia = vi.fn().mockResolvedValue(fakeStream);
    stubGetUserMedia(getUserMedia);

    const { result } = renderHook(() => useCamera());
    await act(async () => {
      await result.current.start();
    });
    act(() => result.current.hide());

    expect(result.current.status).toBe("tray");
    expect(stop).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.start();
    });
    expect(getUserMedia).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe("active");

    act(() => result.current.close());
    expect(stop).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe("idle");
  });

  it("hard close during a pending request stops a late stream", async () => {
    const stop = vi.fn();
    const fakeStream = { getTracks: () => [{ stop }] } as unknown as MediaStream;
    let resolveStream!: (stream: MediaStream) => void;
    const getUserMedia = vi.fn(() => new Promise<MediaStream>((resolve) => { resolveStream = resolve; }));
    stubGetUserMedia(getUserMedia);

    const { result } = renderHook(() => useCamera());
    let startPromise!: Promise<void>;
    act(() => {
      startPromise = result.current.start();
    });
    act(() => result.current.close());
    await act(async () => {
      resolveStream(fakeStream);
      await startPromise;
    });

    expect(stop).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe("idle");
  });
});