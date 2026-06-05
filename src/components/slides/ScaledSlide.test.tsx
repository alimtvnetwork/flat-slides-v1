import { render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ScaledSlide } from "./ScaledSlide";

describe("ScaledSlide", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    for (const name of ["--stage-scale", "--presenter-frame-left", "--presenter-frame-top", "--presenter-frame-right", "--presenter-frame-bottom"]) {
      document.documentElement.style.removeProperty(name);
    }
  });

  it("falls back to the parent rect when the stage initially measures at zero", async () => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      if (this.classList.contains("slide-stage")) return rect(0, 0);
      if (this.dataset.testid === "host") return rect(1024, 768);
      return rect(0, 0);
    });

    render(
      <div data-slide-presenter-root>
        <div data-testid="host">
          <ScaledSlide>
            <div />
          </ScaledSlide>
        </div>
      </div>,
    );

    await waitFor(() => {
      expect(document.documentElement.style.getPropertyValue("--stage-scale")).toBe(String(1024 / 1920));
    });
    expect(document.documentElement.style.getPropertyValue("--presenter-frame-bottom")).toBe("96px");
  });
});

function rect(width: number, height: number) {
  return { width, height, left: 0, top: 0, right: width, bottom: height, x: 0, y: 0, toJSON: () => ({}) } as DOMRect;
}