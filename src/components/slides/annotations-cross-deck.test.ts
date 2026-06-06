import { describe, expect, it } from "vitest";

import { useAnnotations } from "./annotations-store";
import { useDeck } from "./store";

/**
 * Issue 019 regression — annotations from the previous deck must NOT
 * render on the new deck after import. The store's `setDeck` already
 * calls `useAnnotations.clearAll()`; this test locks that contract
 * specifically against the cross-deck symptom from issue 019.
 *
 * (We chose "clear-on-replace" over the original `${deckId}:${slideId}`
 * keying plan because annotations are session-only by default — wiping
 * on deck swap matches user intent without changing the storage shape.)
 */
describe("annotations don't leak across decks (issue 019)", () => {
  it("strokes from deck A are gone after deck B is loaded — even if slide ids overlap", () => {
    const original = useDeck.getState().deck;
    const sharedSlideId = original.slides[0]?.id ?? "shared";

    // Deck A: draw ink on the shared slide id.
    useAnnotations.getState().beginStroke(sharedSlideId, { x: 10, y: 10 });
    expect(useAnnotations.getState().strokes[sharedSlideId]).toHaveLength(1);

    // Deck B has the SAME first-slide id — the bug was that strokes
    // bucketed by slide id alone bled through.
    useDeck.getState().setDeck({
      ...original,
      id: "deck-b",
      title: "Deck B",
      slides: [{ ...original.slides[0], id: sharedSlideId }],
    });

    expect(useAnnotations.getState().strokes).toEqual({});
  });
});
