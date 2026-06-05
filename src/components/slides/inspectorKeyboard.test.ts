import { describe, expect, it, vi } from "vitest";

import { dispatchInspectorKey } from "./presenterActions";

function eventFor(key: string, code = key) {
  return {
    key,
    code,
    preventDefault: vi.fn(),
  } as unknown as KeyboardEvent;
}

function ctxFor(event: KeyboardEvent) {
  return {
    event,
    current: 5,
    stepNum: 0,
    stepCount: 5,
    total: 9,
    goPrev: vi.fn(),
    goNext: vi.fn(),
    exitInspector: vi.fn(),
    resetTimer: vi.fn(),
    toggleTimerPause: vi.fn(),
  };
}

describe("inspector keyboard dispatcher", () => {
  it("maps arrows and enter to scoped inspector navigation", () => {
    const next = ctxFor(eventFor("ArrowRight"));
    const prev = ctxFor(eventFor("ArrowLeft"));
    expect(dispatchInspectorKey(next)?.id).toBe("inspector-nav-next");
    expect(dispatchInspectorKey(prev)?.id).toBe("inspector-nav-prev");
    expect(next.goNext).toHaveBeenCalledTimes(1);
    expect(prev.goPrev).toHaveBeenCalledTimes(1);
  });

  it("maps R, P, and Escape to inspector-only side effects", () => {
    const reset = ctxFor(eventFor("r", "KeyR"));
    const pause = ctxFor(eventFor("p", "KeyP"));
    const exit = ctxFor(eventFor("Escape"));
    expect(dispatchInspectorKey(reset)?.id).toBe("inspector-reset-timer");
    expect(dispatchInspectorKey(pause)?.id).toBe("inspector-toggle-timer-pause");
    expect(dispatchInspectorKey(exit)?.id).toBe("inspector-exit");
    expect(reset.resetTimer).toHaveBeenCalledTimes(1);
    expect(pause.toggleTimerPause).toHaveBeenCalledTimes(1);
    expect(exit.exitInspector).toHaveBeenCalledTimes(1);
  });
});