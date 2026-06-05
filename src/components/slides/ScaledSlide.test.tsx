import { render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ScaledSlide } from "./ScaledSlide";

describe("ScaledSlide", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.documentElement.style.removeProperty("--stage-scale");
  });

  it("falls back to the parent rect when the stage initially measures at zero", async () => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      if (this.classList.contains("slide-stage")) return rect(0, 0);
      if (this.dataset.testid === "host") return rect(1024, 768);
      return rect(0, 0);
    });

    render(
      <div data-testid="host">
        <ScaledSlide>
          <div />
        </ScaledSlide>
      </div>,
    );

    await waitFor(() => {
      expect(document.documentElement.style.getPropertyValue("--stage-scale")).toBe(String(1024 / 1920));
    });
  });
});

function rect(width: number, height: number) {
  return { width, height, left: 0, top: 0, right: width, bottom: height, x: 0, y: 0, toJSON: () => ({}) } as DOMRect;
}