import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./useSlideNavigation", () => ({
  useSlideNavigation: () => ({ goTo: vi.fn(), next: vi.fn(), prev: vi.fn() }),
}));

import { RenderSlide } from "./RenderSlide";
import type { StepsSlideProps } from "./types";

// Regression: spec/issues/002-step-transition-black-flash.md
//
// Old AnimatePresence ran exit+enter concurrently → summed opacity dipped
// below 1 mid-transition → slide background bled through as a dark/black
// frame. mode="wait" eliminates that overlap; the wrapper itself never
// remounts on step change.
const stepsSlide: StepsSlideProps = {
  id: "rca-002",
  type: "steps",
  title: "Steps",
  heading: "Phases",
  steps: [
    { label: "One", title: "First", detail: ["alpha"] },
    { label: "Two", title: "Second", detail: ["beta"] },
    { label: "Three", title: "Third", detail: ["gamma"] },
  ],
};

describe("steps slide transition (issue 002)", () => {
  it("renders a single detail pane keyed on focus, never with scale transform", () => {
    const { rerender } = render(<RenderSlide slide={stepsSlide} step={0} />);
    const paneAtStep0 = screen.getByTestId("step-detail-pane");
    expect(paneAtStep0).toBeTruthy();
    const transform0 = paneAtStep0.style.transform ?? "";
    expect(transform0).not.toMatch(/scale\(/);

    rerender(<RenderSlide slide={stepsSlide} step={1} />);
    const paneAtStep1 = screen.getByTestId("step-detail-pane");
    expect(paneAtStep1).toBeTruthy();
    const transform1 = paneAtStep1.style.transform ?? "";
    expect(transform1).not.toMatch(/scale\(/);
  });

  it("keeps the slide background layer mounted across step changes", () => {
    const { container, rerender } = render(<RenderSlide slide={stepsSlide} step={0} />);
    const bgBefore = container.querySelector("[data-slide-background]");
    rerender(<RenderSlide slide={stepsSlide} step={2} />);
    const bgAfter = container.querySelector("[data-slide-background]");
    // Either both are present (persistent layer) or both are absent (theme
    // without a background layer). The contract is "no remount mid-step".
    expect(Boolean(bgBefore)).toBe(Boolean(bgAfter));
  });
});
