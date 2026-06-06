import { act } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { useDeck } from "./store";

describe("setSettings immutability (issue 004)", () => {
  afterEach(() => act(() => useDeck.getState().resetDeck()));

  it("produces a new top-level deck reference so deck-level selectors re-run", () => {
    const before = useDeck.getState().deck;
    act(() => useDeck.getState().setSettings({ darken: 50 }));
    const after = useDeck.getState().deck;
    expect(after).not.toBe(before);
    expect(after.settings).not.toBe(before.settings);
    expect(after.settings.darken).toBe(50);
  });

  it("produces a new deck.settings reference on every patch", () => {
    act(() => useDeck.getState().setSettings({ blur: 5 }));
    const a = useDeck.getState().deck.settings;
    act(() => useDeck.getState().setSettings({ blur: 6 }));
    const b = useDeck.getState().deck.settings;
    expect(b).not.toBe(a);
  });
});
