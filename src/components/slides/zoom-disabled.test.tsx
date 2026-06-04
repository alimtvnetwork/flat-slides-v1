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
  steps: [{ label: "One", detail: ["One"] }],
  focus: [{ x: 100, y: 100, w: 400, h: 300, step: 1 }],
};

describe("disabled zoom effects", () => {
  afterEach(() => {
    useDeck.getState().resetDeck();
  });

  it("CameraStage does not scale slides even when focus regions exist", () => {
    render(
      <CameraStage slide={focusedSlide} step={1}>
        <div data-testid="slide-body" />
      </CameraStage>,
    );

    expect(screen.getByTestId("slide-body").parentElement?.style.transform).toBe("");
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