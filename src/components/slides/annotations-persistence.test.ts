/**
 * Regression test for the annotation persistence flag
 * (mem://features/slides-motion-and-focus). The SettingsDrawer toggles
 * `setPersist(true|false)`; the store's `partialize` (annotations-store.ts:104)
 * is the only thing that decides whether strokes survive a reload. If a
 * future refactor changes the partialize contract, presenters lose their
 * ink silently.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { useAnnotations } from "./annotations-store";

const STORAGE_KEY = "slides-annotations-v1";

function resetStore() {
  useAnnotations.setState({ strokes: {}, persistStrokes: false });
  localStorage.removeItem(STORAGE_KEY);
}

describe("annotation persistence flag", () => {
  beforeEach(resetStore);
  afterEach(resetStore);

  it("does NOT persist strokes when persistStrokes is false (default)", () => {
    const id = useAnnotations.getState().beginStroke("slide-1", { x: 1, y: 1 });
    expect(id).toMatch(/^ink_/);

    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.state.persistStrokes).toBe(false);
    // strokes must be absent when the flag is off — partialize strips them.
    expect(parsed.state.strokes).toBeUndefined();
  });

  it("persists strokes when persistStrokes is true and survives a store remount", async () => {
    useAnnotations.getState().setPersist(true);
    useAnnotations.getState().beginStroke("slide-2", { x: 5, y: 5 });

    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.state.persistStrokes).toBe(true);
    expect(parsed.state.strokes["slide-2"]).toHaveLength(1);
    expect(parsed.state.strokes["slide-2"][0].points).toEqual([{ x: 5, y: 5 }]);

    // Simulate a reload: wipe in-memory state, then rehydrate from storage.
    useAnnotations.setState({ strokes: {}, persistStrokes: false });
    useAnnotations.persist.rehydrate();

    const after = useAnnotations.getState();
    expect(after.persistStrokes).toBe(true);
    expect(after.strokes["slide-2"]).toHaveLength(1);
  });
});
