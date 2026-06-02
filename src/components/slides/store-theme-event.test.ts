import { describe, expect, it, vi } from "vitest";

import { useDeck } from "./store";
import { onSlidesEvent } from "./telemetry";

describe("store.setThemeId", () => {
  it("emits a theme-change telemetry event", () => {
    const handler = vi.fn();
    const off = onSlidesEvent(handler);
    useDeck.getState().setThemeId("midnight");
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ type: "theme-change", themeId: "midnight" }),
    );
    off();
  });
});
