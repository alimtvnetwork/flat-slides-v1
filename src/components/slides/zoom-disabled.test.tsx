import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { CameraStage } from "./CameraStage";
import { canUseCameraZoom, resolveSlideTransition } from "./SlideTransition";
import { useDeck } from "./store";
import { getActiveFocusRegion } from "./types";
import { parseDeckJson } from "@/lib/slides/io";

const focusedSlide = {
  id: "focus",
  type: "steps" as const,
  title: "Focus",
  heading: "Focus",
  steps: [{ label: "One", detail: ["One"] }, { label: "Two", detail: ["Two"] }],
  focus: [{ x: 100, y: 100, w: 400, h: 300, step: 2 }],
};

const multiFocusSlide = {
  ...focusedSlide,
  steps: [...focusedSlide.steps, { label: "Three", detail: ["Three"] }],
  focus: [
    { x: 100, y: 100, w: 400, h: 300, step: 2 },
    { x: 880, y: 200, w: 960, h: 680, step: 3 },
  ],
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

  it("ignores unbound focus regions on step-aware slides so first entry stays full-frame", () => {
    const unsafeUnboundSlide = {
      ...focusedSlide,
      focus: [{ x: 100, y: 100, w: 400, h: 300 }],
    };

    expect(getActiveFocusRegion(unsafeUnboundSlide, 1)).toBeNull();
    render(
      <CameraStage slide={unsafeUnboundSlide} step={1}>
        <div data-testid="slide-body" />
      </CameraStage>,
    );

    expect(screen.getByTestId("slide-body").parentElement?.style.transform).toBe("translate3d(0px, 0px, 0) scale(1)");
  });

  it("keeps the /slides/N overview route full-frame even if step 1 has focus", () => {
    const stepOneFocusedSlide = {
      ...focusedSlide,
      focus: [{ x: 100, y: 100, w: 400, h: 300, step: 1 }],
    };

    render(
      <CameraStage slide={stepOneFocusedSlide} step={0}>
        <div data-testid="slide-body" />
      </CameraStage>,
    );

    expect(screen.getByTestId("slide-body").parentElement?.style.transform).toBe("translate3d(0px, 0px, 0) scale(1)");
  });

  it("CameraStage animates from full-frame into the active 1-based focus region", async () => {
    render(
      <CameraStage slide={focusedSlide} step={2}>
        <div data-testid="slide-body" />
      </CameraStage>,
    );

    const cameraLayer = screen.getByTestId("slide-body").parentElement;
    expect(cameraLayer?.style.transform).toBe("translate3d(0px, 0px, 0) scale(1)");
    await waitFor(() => expect(cameraLayer?.style.transform).toContain("scale(2.195)"));
    expect(cameraLayer?.style.transition).toContain("transform 700ms");
  });

  it("CameraStage restarts from full-frame when navigating between focused steps", async () => {
    const { rerender } = render(
      <CameraStage slide={multiFocusSlide} step={2}>
        <div data-testid="slide-body" />
      </CameraStage>,
    );
    const cameraLayer = screen.getByTestId("slide-body").parentElement;
    await waitFor(() => expect(cameraLayer?.style.transform).toContain("scale(2.195)"));

    rerender(
      <CameraStage slide={multiFocusSlide} step={3}>
        <div data-testid="slide-body" />
      </CameraStage>,
    );

    expect(cameraLayer?.style.transform).toBe("translate3d(0px, 0px, 0) scale(1)");
    await waitFor(() => expect(cameraLayer?.style.transform).toContain("scale(1.239)"));
  });

  it("accepts imported opt-in camera-zoom deck transitions", () => {
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

    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.value.settings.transition).toBe("camera-zoom");
  });

  it("keeps camera-zoom off for steps, timelines, and focus-region slides", () => {
    const timelineSlide = {
      id: "timeline",
      type: "timeline" as const,
      title: "Timeline",
      items: [{ label: "One" }, { label: "Two" }],
    };
    const heroSlide = { id: "hero", type: "center" as const, title: "Hero", heading: ["Hero"] };

    expect(canUseCameraZoom(focusedSlide)).toBe(false);
    expect(canUseCameraZoom(timelineSlide)).toBe(false);
    expect(canUseCameraZoom(heroSlide)).toBe(true);
    expect(resolveSlideTransition("camera-zoom", focusedSlide, false).willChange).toBe("opacity");
    expect(resolveSlideTransition("camera-zoom", heroSlide, false).willChange).toBe("opacity, transform");
    expect(resolveSlideTransition("camera-zoom", heroSlide, true).willChange).toBe("opacity");
  });

  it("bundled demo focus regions zoom visibly on labelled zoom steps", async () => {
    useDeck.getState().resetDeck();
    const demo = useDeck.getState().deck.slides.find((slide) => slide.id === "focus-demo");
    expect(demo).toBeDefined();
    if (!demo) return;

    const { rerender } = render(
      <CameraStage slide={demo} step={2}>
        <div data-testid="slide-body" />
      </CameraStage>,
    );
    const cameraLayer = screen.getByTestId("slide-body").parentElement;
    await waitFor(() => expect(cameraLayer?.style.transform).toContain("scale(1."));

    rerender(
      <CameraStage slide={demo} step={3}>
        <div data-testid="slide-body" />
      </CameraStage>,
    );
    await waitFor(() => expect(cameraLayer?.style.transform).toContain("scale(1."));
  });
});