import { describe, expect, it, vi } from "vitest";

import { useAnnotations } from "./annotations-store";
import { devResetCachedDeck } from "./devResetDeck";
import { useDeck } from "./store";

describe("devResetCachedDeck (issue 018)", () => {
  it("clears persisted storage, resets the deck, and wipes annotations", async () => {
    const clearStorage = vi
      .spyOn(useDeck.persist, "clearStorage")
      .mockResolvedValue(undefined as unknown as void);

    // Dirty state: ink on a slide id + a mutated deck title.
    useAnnotations.getState().beginStroke("any", { x: 1, y: 1 });
    useDeck.setState((s) => ({ deck: { ...s.deck, title: "Mutated" } }));

    await devResetCachedDeck();

    expect(clearStorage).toHaveBeenCalledTimes(1);
    expect(useAnnotations.getState().strokes).toEqual({});
    // resetDeck restores the seed title "Sample Deck".
    expect(useDeck.getState().deck.title).toBe("Sample Deck");

    clearStorage.mockRestore();
  });

  it("re-throws and logs when clearStorage fails", async () => {
    const err = new Error("boom");
    const clearStorage = vi.spyOn(useDeck.persist, "clearStorage").mockRejectedValue(err);
    const errLog = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(devResetCachedDeck()).rejects.toThrow("boom");
    expect(errLog).toHaveBeenCalledWith(
      "[devResetCachedDeck] clearStorage failed",
      err,
    );

    clearStorage.mockRestore();
    errLog.mockRestore();
  });
});
