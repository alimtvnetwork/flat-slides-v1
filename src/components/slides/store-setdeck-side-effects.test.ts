import { describe, expect, it } from "vitest";

import { useDeck } from "./store";
import { useAnnotations } from "./annotations-store";

/**
 * Issue 010 regression — `useDeck.setDeck(deck)` must wipe presenter
 * annotations and re-seat `lastVisitedSlideId` on the new deck's first
 * slide so the import doesn't inherit ink from the previous deck and the
 * route can resolve `/slides/1` cleanly.
 */
describe("useDeck.setDeck side effects (issue 010)", () => {
  it("clears annotations and resets lastVisitedSlideId", () => {
    // Seed: annotation on a slide id that won't exist in the new deck.
    useAnnotations.getState().beginStroke("ghost-slide", { x: 100, y: 100 });
    expect(Object.keys(useAnnotations.getState().strokes)).toContain("ghost-slide");

    const current = useDeck.getState().deck;
    const newDeck = {
      ...current,
      id: "fresh-deck",
      title: "Fresh",
      slides: [{ ...current.slides[0], id: "first-of-fresh" }],
    };
    useDeck.getState().setDeck(newDeck);

    expect(useAnnotations.getState().strokes).toEqual({});
    expect(useDeck.getState().lastVisitedSlideId).toBe("first-of-fresh");
    expect(useDeck.getState().deck.id).toBe("fresh-deck");
  });
});
