import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ScaledSlide } from "./ScaledSlide";

describe("ScaledSlide zero-height guardrail (issue 017)", () => {
  beforeEach(() => {
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
      x: 0, y: 0, top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, toJSON: () => ({}),
    } as DOMRect);
  });
  afterEach(() => vi.restoreAllMocks());

  it("marks the stage with data-debug-zero-height when parent collapses to 0", () => {
    const { container } = render(
      <div style={{ display: "flex", flex: 1 }}>
        <ScaledSlide>
          <div>slide</div>
        </ScaledSlide>
      </div>,
    );
    const stage = container.querySelector(".slide-stage") as HTMLElement;
    expect(stage).not.toBeNull();
    expect(stage.getAttribute("data-debug-zero-height")).toBe("true");
  });

  it("warns in dev when parent is 0 px", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <div>
        <ScaledSlide>
          <div>slide</div>
        </ScaledSlide>
      </div>,
    );
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("[ScaledSlide] parent reported 0px size"),
      expect.anything(),
    );
  });
});
