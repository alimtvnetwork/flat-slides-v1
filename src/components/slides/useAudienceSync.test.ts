import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAudienceSync } from "./useAudienceSync";

/**
 * Issue 021 regression — re-rendering the hook with new slide args must
 * NOT construct a new BroadcastChannel. Only a `sessionId` change should.
 */
class MockChannel {
  static instances: MockChannel[] = [];
  name: string;
  listeners = new Set<(e: MessageEvent) => void>();
  closed = false;
  postedCount = 0;
  constructor(name: string) {
    this.name = name;
    MockChannel.instances.push(this);
  }
  addEventListener(_: "message", fn: (e: MessageEvent) => void) { this.listeners.add(fn); }
  removeEventListener(_: "message", fn: (e: MessageEvent) => void) { this.listeners.delete(fn); }
  postMessage(_: unknown) { this.postedCount += 1; }
  close() { this.closed = true; this.listeners.clear(); }
}

describe("useAudienceSync (issue 021)", () => {
  beforeEach(() => {
    MockChannel.instances = [];
    // @ts-expect-error inject mock
    globalThis.BroadcastChannel = MockChannel;
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates exactly one channel across 100 slide-arg rerenders", () => {
    const initial = { slideIndex: 0, slideId: "a", stepNum: 1, total: 5 };
    const { rerender, unmount } = renderHook((args: typeof initial) => useAudienceSync(args), { initialProps: initial });

    for (let i = 1; i <= 100; i++) {
      act(() => rerender({ slideIndex: i, slideId: `s${i}`, stepNum: 1, total: 5 }));
    }
    const open = MockChannel.instances.filter((c) => !c.closed);
    expect(MockChannel.instances.length).toBe(1);
    expect(open.length).toBe(1);
    // Lifecycle effect publishes once on mount; publish effect fires on
    // mount + each of the 100 rerenders.
    expect(open[0].postedCount).toBe(102);

    unmount();
    expect(MockChannel.instances[0].closed).toBe(true);
  });
});
