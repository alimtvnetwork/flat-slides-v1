import { beforeEach, describe, expect, it } from "vitest";

import { useAnnotations } from "./annotations-store";
import { useDeck } from "./store";
import type { Deck } from "./types";

/**
 * Regression lock for spec/issues/010-import-deck-skips-store-replacement-side-effects.md
 *
 * `useDeck.setDeck(deck)` must:
 *   1. Replace `deck` with the new one.
 *   2. Reset `lastVisitedSlideId` to the new deck's first slide id (so the
 *      router can land on `/slides/1` cleanly).
 *   3. Clear all in-memory annotations from the previous deck so ink from
 *      deck A does not bleed onto deck B.
 */

const importedDeck: Deck = {
  id: "imported-deck-test",
  title: "Imported Test Deck",
  themeId: "noir",
  settings: {
    backgroundMode: "color",
    backgroundColor: "#101010",
    textColor: "#ffffff",
    darken: 0,
    blur: 0,
    transition: "fade",
    soundEnabled: false,
    volume: 0.5,
    musicVolume: 50,
  },
  slides: [
    { id: "imported-1", type: "center", title: "Imported 1", heading: ["Hello"], align: "center" },
    { id: "imported-2", type: "center", title: "Imported 2", heading: ["World"], align: "center" },
  ],
};

describe("useDeck.setDeck side effects (issue 010)", () => {
  beforeEach(() => {
    useAnnotations.getState().clearAll();
    useDeck.setState({ lastVisitedSlideId: "stale-slide-from-previous-deck" });
  });

  it("replaces deck, resets lastVisitedSlideId, and clears annotations", () => {
    useAnnotations.setState({
      strokes: {
        "stale-slide-from-previous-deck": [
          { id: "s1", points: [{ x: 0, y: 0 }], color: "#ff0000", width: 4 },
        ],
      },
    } as Partial<ReturnType<typeof useAnnotations.getState>>);
    expect(Object.keys(useAnnotations.getState().strokes).length).toBe(1);

    useDeck.getState().setDeck(importedDeck);

    const state = useDeck.getState();
    expect(state.deck.id).toBe("imported-deck-test");
    expect(state.lastVisitedSlideId).toBe("imported-1");
    expect(Object.keys(useAnnotations.getState().strokes).length).toBe(0);
  });
});
