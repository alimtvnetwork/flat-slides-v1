import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAnnotations } from "@/components/slides/annotations-store";
import { useChrome } from "@/components/slides/chrome-store";
import { AUTOFRAME_KEY, POS_KEY } from "@/components/slides/usePresenterWebcam";

import { exportDeck, parseDeckJson } from "./io";
import type { Deck } from "@/components/slides/types";

const deck: Deck = {
  id: "runtime-roundtrip",
  title: "Runtime Roundtrip",
  version: 2,
  themeId: "midnight",
  settings: { backgroundMode: "color", backgroundColor: "#000", darken: 0, blur: 0, transition: "fade", soundEnabled: false, volume: 0.5, musicVolume: 40 },
  slides: [{ id: "one", type: "center", title: "One", heading: ["One"] }],
};

describe("deck runtime metadata round-trip (issue 009)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn(() => "blob:deck") });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
    localStorage.clear();
    document.body.innerHTML = "";
    useAnnotations.getState().clearAll();
    useChrome.getState().setCamera({ shape: "circle", visible: false, fullscreenOnly: true });
    useChrome.getState().setScene("normal");
  });

  it("exportDeck includes chrome, annotation, and webcam runtime state", async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    useChrome.getState().setCamera({ shape: "rect", visible: true, fullscreenOnly: false });
    useAnnotations.getState().beginStroke("one", { x: 10, y: 20 });
    localStorage.setItem(POS_KEY, JSON.stringify({ x: 11, y: 22 }));

    exportDeck(deck);

    expect(click).toHaveBeenCalledOnce();
    const blob = vi.mocked(URL.createObjectURL).mock.calls[0]?.[0] as Blob;
    const json = JSON.parse(await blob.text()) as Deck;
    expect(json.meta?.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(json.meta?.runtime?.chrome?.camera?.shape).toBe("rect");
    expect(json.meta?.runtime?.annotations?.strokes?.one).toHaveLength(1);
    expect(json.meta?.runtime?.webcam?.[POS_KEY]).toContain("11");
  });

  it("parseDeckJson restores runtime metadata when present", () => {
    const runtimeDeck: Deck = {
      ...deck,
      meta: {
        exportedAt: "2026-06-06T00:00:00.000Z",
        runtime: {
          chrome: { camera: { shape: "squircle", visible: true, fullscreenOnly: false }, scene: "split" },
          annotations: { persistStrokes: true, strokes: { one: [{ id: "ink", color: "#fff", width: 8, points: [{ x: 1, y: 2 }] }] } },
          webcam: { [AUTOFRAME_KEY]: "1" },
        },
      },
    };

    const result = parseDeckJson(JSON.stringify(runtimeDeck));

    expect(result.ok).toBe(true);
    expect(useChrome.getState().camera.shape).toBe("squircle");
    expect(useChrome.getState().scene).toBe("split");
    expect(useAnnotations.getState().strokes.one).toHaveLength(1);
    expect(localStorage.getItem(AUTOFRAME_KEY)).toBe("1");
  });
});