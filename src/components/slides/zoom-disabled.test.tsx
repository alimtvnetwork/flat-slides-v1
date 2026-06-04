import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { CameraStage } from "./CameraStage";
import { useDeck } from "./store";
import { parseDeckJson } from "@/lib/slides/io";

const focusedSlide = {
  id: "focus",
  type: "steps" as const,
  title: "Focus",
  heading: "Focus",
  steps: [{ label: "One", detail: ["One"] }, { label: "Two", detail: ["Two"] }],
  focus: [{ x: 100, y: 100, w: 400, h: 300, step: 2 }],
};

describe("opt-in focus zoom effects", () => {
  afterEach(() => {
    useDeck.getState().resetDeck();
  });

  it("CameraStage does not scale slides before a step-bound focus region is active", () => {
    render(
      <CameraStage slide={focusedSlide} step={1}>
        <div data-testid="slide-body" />
      </CameraStage>,
    );

    expect(screen.getByTestId("slide-body").parentElement?.style.transform).toBe("translate3d(0px, 0px, 0) scale(1)");
  });

  it("CameraStage zooms when the active 1-based step has a focus region", () => {
    render(
      <CameraStage slide={focusedSlide} step={2}>
        <div data-testid="slide-body" />
      </CameraStage>,
    );

    const transform = screen.getByTestId("slide-body").parentElement?.style.transform;
    expect(transform).toContain("scale(2.197)");
    expect(transform).not.toBe("translate3d(0px, 0px, 0) scale(1)");
  });

  it("rejects legacy imported non-fade deck transitions", () => {
    const parsed = parseDeckJson(JSON.stringify({
      id: "zoom-deck",
      title: "Zoom Deck",
      slides: [focusedSlide],
      settings: {
        backgroundMode: "color",
        backgroundColor: "#101010",
        darken: 0,
        blur: 0,
        transition: "camera-zoom",
        soundEnabled: true,
        volume: 0.6,
      },
    }));

    expect(parsed.ok).toBe(false);
  });
});