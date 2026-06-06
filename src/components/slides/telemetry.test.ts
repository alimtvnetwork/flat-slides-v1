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

describe("__slidesEvents dev ring buffer", () => {
  beforeEach(() => {
    delete (window as Window).__slidesEvents;
  });

  it("captures emitted events with a timestamp", () => {
    emitSlidesEvent({ type: "home-launcher-click", case: "import" });
    const buf = window.__slidesEvents!;
    expect(buf).toHaveLength(1);
    expect(buf[0]).toMatchObject({ type: "home-launcher-click", case: "import" });
    expect(typeof buf[0].at).toBe("number");
  });

  it("caps the buffer at SLIDES_EVENT_BUFFER_CAP, dropping oldest", () => {
    for (let i = 0; i < SLIDES_EVENT_BUFFER_CAP + 5; i++) {
      emitSlidesEvent({ type: "home-launcher-click", case: `c${i}` });
    }
    const buf = window.__slidesEvents!;
    expect(buf).toHaveLength(SLIDES_EVENT_BUFFER_CAP);
    // First retained event should be c5 (0..4 dropped)
    expect((buf[0] as { case: string }).case).toBe("c5");
    expect((buf[buf.length - 1] as { case: string }).case).toBe(`c${SLIDES_EVENT_BUFFER_CAP + 4}`);
  });
});
});
