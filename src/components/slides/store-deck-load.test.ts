import { describe, expect, it, vi } from "vitest";

import { useDeck } from "./store";
import { onSlidesEvent } from "./telemetry";

describe("store.setDeck telemetry", () => {
  it("emits a deck-load event with slide count and deck id", () => {
    const handler = vi.fn();
    const off = onSlidesEvent(handler);
    const current = useDeck.getState().deck;
    useDeck.getState().setDeck({
      ...current,
      id: "deck-load-test",
      title: "Loaded",
    });
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "deck-load",
        deckId: "deck-load-test",
        title: "Loaded",
        slideCount: current.slides.length,
      }),
    );
    off();
  });
});
