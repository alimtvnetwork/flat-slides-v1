import { describe, expect, it, vi } from "vitest";

import {
  SLIDES_EVENT,
  SLIDES_EVENT_BUFFER_CAP,
  emitSlidesEvent,
  installConsoleSink,
  onSlidesEvent,
} from "./telemetry";

describe("telemetry bus", () => {
  it("dispatches a CustomEvent with the given detail", () => {
    const handler = vi.fn();
    const off = onSlidesEvent(handler);
    emitSlidesEvent({ type: "theme-change", themeId: "midnight" });
    expect(handler).toHaveBeenCalledWith({ type: "theme-change", themeId: "midnight" });
    off();
  });

  it("removes the listener when unsubscribed", () => {
    const handler = vi.fn();
    const off = onSlidesEvent(handler);
    off();
    window.dispatchEvent(new CustomEvent(SLIDES_EVENT, { detail: { type: "scene-change", scene: "normal" } }));
    expect(handler).not.toHaveBeenCalled();
  });

  it("installConsoleSink returns a function (no throw)", () => {
    const off = installConsoleSink();
    expect(typeof off).toBe("function");
    off();
  });
});
