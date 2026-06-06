import { afterEach, describe, expect, it, vi } from "vitest";

import { DECK_SCHEMA_VERSION } from "@/lib/slides/version";

import { migratePersistedDeck } from "./store";

describe("migratePersistedDeck", () => {
  afterEach(() => vi.restoreAllMocks());

  it("returns the payload unchanged when versions match", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const payload = { deck: { id: "anything" }, themeId: "midnight" };

    const out = migratePersistedDeck(payload, DECK_SCHEMA_VERSION);

    expect(out).toBe(payload);
    expect(warn).not.toHaveBeenCalled();
  });

  it("drops the payload and warns with both versions when versions differ", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const stale = { deck: { id: "old" } };
    const fromVersion = DECK_SCHEMA_VERSION - 1;

    const out = migratePersistedDeck(stale, fromVersion);

    expect(out).toBeUndefined();
    expect(warn).toHaveBeenCalledTimes(1);
    const msg = warn.mock.calls[0][0] as string;
    expect(msg).toContain("[slides:persist] dropping");
    expect(msg).toContain(`v${fromVersion}`);
    expect(msg).toContain(`current v${DECK_SCHEMA_VERSION}`);
  });
});
