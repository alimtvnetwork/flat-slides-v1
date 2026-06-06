import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  INSPECTOR_KEY_ACTIONS,
  MODIFIER_SHORTCUT_IDS,
  PRESENTER_KEY_ACTIONS,
  dispatchPresenterKey,
  inspectorKeyShortcuts,
  plainKeyShortcuts,
} from "./presenterActions";
import { SHORTCUTS } from "./shortcuts";

const baseCtx = () => ({
  event: new KeyboardEvent("keydown", { key: "x" }),
  slideId: "s1",
  current: 1,
  isStepRoute: false,
  stepNum: 0,
  toggleFullscreen: vi.fn(),
  toggleTopJumper: vi.fn(),
  toggleCamera: vi.fn(),
  toggleMusic: vi.fn(),
  cycleScene: vi.fn(),
  openOverview: vi.fn(),
  openHelp: vi.fn(),
});

describe("presenterActions — single keymap parity (Step 26)", () => {
  it("every SHORTCUTS id is unique", () => {
    const ids = SHORTCUTS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every plain-key SHORTCUTS entry has a registered action OR is explicitly modifier-handled", () => {
    const missing = plainKeyShortcuts()
      .filter((s) => !PRESENTER_KEY_ACTIONS[s.id] && !MODIFIER_SHORTCUT_IDS.has(s.id))
      .map((s) => s.id);
    expect(missing).toEqual([]);
  });

  it("every inspector SHORTCUTS entry has a registered inspector action", () => {
    const missing = inspectorKeyShortcuts()
      .filter((s) => !INSPECTOR_KEY_ACTIONS[s.id])
      .map((s) => s.id);
    expect(missing).toEqual([]);
  });

  it("dispatches by SHORTCUTS id, not by key string", () => {
    const ctx = { ...baseCtx(), event: new KeyboardEvent("keydown", { key: "g" }) };
    const def = dispatchPresenterKey(ctx);
    expect(def?.id).toBe("open-overview");
    expect(ctx.openOverview).toHaveBeenCalledTimes(1);
  });

  it("returns undefined for unmapped keys", () => {
    const ctx = { ...baseCtx(), event: new KeyboardEvent("keydown", { key: "z" }) };
    expect(dispatchPresenterKey(ctx)).toBeUndefined();
  });

  it("plain I toggles the camera", () => {
    const ctx = { ...baseCtx(), event: new KeyboardEvent("keydown", { key: "i" }) };
    const def = dispatchPresenterKey(ctx);
    expect(def?.id).toBe("webcam-hard-toggle");
    expect(ctx.toggleCamera).toHaveBeenCalledTimes(1);
  });

  it("plain F and uppercase F both toggle fullscreen", () => {
    for (const event of [new KeyboardEvent("keydown", { key: "f" }), new KeyboardEvent("keydown", { key: "F", shiftKey: true })]) {
      const ctx = { ...baseCtx(), event };
      const def = dispatchPresenterKey(ctx);
      expect(def?.id).toBe("fullscreen-toggle");
      expect(ctx.toggleFullscreen).toHaveBeenCalledTimes(1);
    }
  });

  it("Shift+I opens /slides/inspector/N in a new window", () => {
    const originalOpen = window.open;
    const openSpy = vi.fn();
    window.open = openSpy as unknown as typeof window.open;
    try {
      const ctx = {
        ...baseCtx(),
        current: 7,
        event: new KeyboardEvent("keydown", { key: "I", shiftKey: true }),
      };
      const def = dispatchPresenterKey(ctx);
      expect(def?.id).toBe("open-inspector");
      expect(openSpy).toHaveBeenCalledTimes(1);
      const [url, target] = openSpy.mock.calls[0];
      expect(url).toMatch(/\/slides\/inspector\/7$/);
      expect(target).toBe("riseup-presenter-inspector");
    } finally {
      window.open = originalOpen;
    }
  });
});
