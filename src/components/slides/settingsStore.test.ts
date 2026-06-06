import { act } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  DEFAULT_DECK_SETTINGS,
  SETTINGS_STORAGE_KEY,
  parsePersistedDeckSettings,
} from "./settingsPersistence";
import { useDeck } from "./store";
import type { DeckSettings } from "./types";

function storedSettings(): DeckSettings {
  const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY) ?? "{}";
  return (JSON.parse(raw) as { settings: DeckSettings }).settings;
}

describe("settings persistence", () => {
  afterEach(() => {
    window.localStorage.removeItem(SETTINGS_STORAGE_KEY);
    act(() => useDeck.getState().resetDeck());
  });

  it("persists all deck settings under the current settings storage key", () => {
    act(() => useDeck.getState().setSettings({
      backgroundMode: "image",
      backgroundColor: "#224466",
      backgroundImage: "/fallback.png",
      darken: 35,
      blur: 12,
      transition: "camera-zoom",
      soundEnabled: false,
      volume: 0.25,
      musicVolume: 75,
    }));

    expect(storedSettings()).toMatchObject({
      backgroundMode: "image",
      backgroundColor: "#224466",
      backgroundImage: "/fallback.png",
      darken: 35,
      blur: 12,
      transition: "camera-zoom",
      soundEnabled: false,
      volume: 0.25,
      musicVolume: 75,
    });
  });

  it("resets persisted settings to defaults", () => {
    act(() => useDeck.getState().setSettings({ backgroundMode: "dark", darken: 60, blur: 16 }));
    act(() => useDeck.getState().resetDeck());

    expect(useDeck.getState().deck.settings).toEqual(DEFAULT_DECK_SETTINGS);
    expect(storedSettings()).toEqual(DEFAULT_DECK_SETTINGS);
  });

  it("falls back safely when persisted settings JSON is corrupt", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    expect(parsePersistedDeckSettings("{broken-json")).toBeNull();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});