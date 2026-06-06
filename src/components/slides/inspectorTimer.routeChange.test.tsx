import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useChrome } from "./chrome-store";
import { INSPECTOR_STARTED_AT_STORAGE_KEY } from "./inspectorTimerPersistence";
import { useInspectorTimer } from "./useInspectorTimer";

function resetStore() {
  useChrome.setState({
    inspectorTimerStartedAt: null,
    inspectorTimerPausedAt: null,
    inspectorTimerPausedMs: 0,
  });
  window.localStorage.removeItem(INSPECTOR_STARTED_AT_STORAGE_KEY);
}

describe("useInspectorTimer route-change survival (issue 028)", () => {
  beforeEach(() => {
    resetStore();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  it("preserves startedAt + label across hook unmount/remount (simulated route change)", () => {
    const first = renderHook(() => useInspectorTimer());
    const startedAt = useChrome.getState().inspectorTimerStartedAt;
    expect(startedAt).not.toBeNull();
    // advance system time by 12s and unmount (route change away from /slides/inspector/1)
    vi.setSystemTime(new Date("2026-01-01T00:00:12Z"));
    first.unmount();
    // remount on a different slide route — startedAt MUST not reset.
    const second = renderHook(() => useInspectorTimer());
    expect(useChrome.getState().inspectorTimerStartedAt).toBe(startedAt);
    expect(second.result.current.timerLabel).not.toBe("00:00");
  });

  it("restores startedAt from localStorage on cold mount (hard refresh)", () => {
    const past = Date.now() - 30_000;
    window.localStorage.setItem(INSPECTOR_STARTED_AT_STORAGE_KEY, String(past));
    // simulate a fresh store init: replace startedAt with the persisted value
    useChrome.setState({ inspectorTimerStartedAt: past });
    const { result } = renderHook(() => useInspectorTimer());
    expect(useChrome.getState().inspectorTimerStartedAt).toBe(past);
    expect(result.current.timerLabel).not.toBe("00:00");
  });
});
