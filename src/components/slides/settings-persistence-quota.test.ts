import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  DEFAULT_DECK_SETTINGS,
  SETTINGS_STORAGE_KEY,
  clearPersistedDecks,
  persistDeckSettings,
} from "./settingsPersistence";

const sonner = vi.hoisted(() => ({
  toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }),
}));
vi.mock("sonner", () => sonner);

function quotaError(): DOMException {
  const err = new Error("quota") as DOMException;
  (err as { name: string }).name = "QuotaExceededError";
  return err;
}

describe("settingsPersistence quota handling (issue 025)", () => {
  beforeEach(() => {
    window.localStorage.clear();
    sonner.toast.error.mockReset();
    sonner.toast.success.mockReset();
  });
  afterEach(() => vi.restoreAllMocks());

  it("returns false and toasts when localStorage throws QuotaExceededError", () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw quotaError(); });
    const ok = persistDeckSettings(DEFAULT_DECK_SETTINGS);
    expect(ok).toBe(false);
    expect(spy).toHaveBeenCalled();
    expect(sonner.toast.error).toHaveBeenCalledWith(
      "Storage full — settings not saved.",
      expect.objectContaining({ action: expect.objectContaining({ label: "Clear saved decks" }) }),
    );
  });

  it("returns true on a normal write", () => {
    expect(persistDeckSettings(DEFAULT_DECK_SETTINGS)).toBe(true);
    expect(window.localStorage.getItem(SETTINGS_STORAGE_KEY)).toContain("\"version\":2");
    expect(sonner.toast.error).not.toHaveBeenCalled();
  });

  it("clearPersistedDecks removes only riseup.deck.* keys", () => {
    window.localStorage.setItem("riseup.deck.a", "x");
    window.localStorage.setItem("riseup.deck.b", "y");
    window.localStorage.setItem("unrelated", "z");
    expect(clearPersistedDecks()).toBe(2);
    expect(window.localStorage.getItem("riseup.deck.a")).toBeNull();
    expect(window.localStorage.getItem("unrelated")).toBe("z");
  });
});
