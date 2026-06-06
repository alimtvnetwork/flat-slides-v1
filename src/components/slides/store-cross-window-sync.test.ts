import { describe, expect, it, vi } from "vitest";

import { syncDeckAcrossWindows, useDeck } from "./store";

/**
 * Issue 020 regression — a `storage` event on `slides-deck-v1` from
 * another window must trigger `useDeck.persist.rehydrate()` in this
 * window so popup presenters pick up newly imported decks on refresh
 * AND while open.
 */
describe("useDeck cross-window sync (issue 020)", () => {
  it("rehydrates on cross-window storage events for slides-deck-v1", () => {
    const rehydrate = vi.spyOn(useDeck.persist, "rehydrate").mockResolvedValue();
    const cleanup = syncDeckAcrossWindows();
    const baseline = rehydrate.mock.calls.length;

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "slides-deck-v1",
        newValue: JSON.stringify({ state: {}, version: 0 }),
      }),
    );
    const afterRelevant = rehydrate.mock.calls.length;
    expect(afterRelevant).toBeGreaterThan(baseline);

    // Unrelated keys must NOT trigger a rehydrate.
    window.dispatchEvent(new StorageEvent("storage", { key: "some-other-key", newValue: "x" }));
    expect(rehydrate.mock.calls.length).toBe(afterRelevant);

    // Removal (newValue=null) is a no-op — don't wipe on tab cleanup.
    window.dispatchEvent(new StorageEvent("storage", { key: "slides-deck-v1", newValue: null }));
    expect(rehydrate.mock.calls.length).toBe(afterRelevant);

    cleanup();
    rehydrate.mockRestore();
  });
});
