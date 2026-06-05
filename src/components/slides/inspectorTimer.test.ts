import { beforeEach, describe, expect, it } from "vitest";

import { useChrome } from "./chrome-store";
import { INSPECTOR_STARTED_AT_STORAGE_KEY } from "./inspectorTimerPersistence";

function resetStore() {
  useChrome.setState({
    inspectorTimerStartedAt: null,
    inspectorTimerPausedAt: null,
    inspectorTimerPausedMs: 0,
  });
  window.localStorage.removeItem(INSPECTOR_STARTED_AT_STORAGE_KEY);
}

describe("inspector timer reducer", () => {
  beforeEach(resetStore);

  it("ensureInspectorTimerStarted sets and persists start once", () => {
    useChrome.getState().ensureInspectorTimerStarted(1000);
    expect(useChrome.getState().inspectorTimerStartedAt).toBe(1000);
    expect(window.localStorage.getItem(INSPECTOR_STARTED_AT_STORAGE_KEY)).toBe("1000");

    useChrome.getState().ensureInspectorTimerStarted(5000);
    expect(useChrome.getState().inspectorTimerStartedAt).toBe(1000);
  });

  it("resetInspectorTimer overwrites start and clears pause", () => {
    useChrome.setState({ inspectorTimerStartedAt: 100, inspectorTimerPausedAt: 200, inspectorTimerPausedMs: 50 });
    useChrome.getState().resetInspectorTimer(9000);
    const s = useChrome.getState();
    expect(s.inspectorTimerStartedAt).toBe(9000);
    expect(s.inspectorTimerPausedAt).toBeNull();
    expect(s.inspectorTimerPausedMs).toBe(0);
    expect(window.localStorage.getItem(INSPECTOR_STARTED_AT_STORAGE_KEY)).toBe("9000");
  });

  it("toggleInspectorTimerPause starts → pauses → resumes accumulating pausedMs", () => {
    const { toggleInspectorTimerPause } = useChrome.getState();

    toggleInspectorTimerPause(1_000);
    expect(useChrome.getState().inspectorTimerStartedAt).toBe(1_000);

    toggleInspectorTimerPause(3_000);
    expect(useChrome.getState().inspectorTimerPausedAt).toBe(3_000);

    toggleInspectorTimerPause(4_500);
    const after = useChrome.getState();
    expect(after.inspectorTimerPausedAt).toBeNull();
    expect(after.inspectorTimerPausedMs).toBe(1_500);
  });
});
