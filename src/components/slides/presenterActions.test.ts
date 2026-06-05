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
});
