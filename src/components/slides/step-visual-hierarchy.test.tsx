import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RenderSlide } from "./RenderSlide";
import type { StepsSlideProps } from "./types";

const SLIDE: StepsSlideProps = {
  id: "step-hierarchy-test",
  type: "steps",
  title: "Step Hierarchy",
  heading: "Steps",
  steps: [
    { label: "01", title: "First", detail: [] },
    { label: "02", title: "Second", detail: [] },
    { label: "03", title: "Third", detail: [] },
  ],
};

function rows(container: HTMLElement) {
  return Array.from(container.querySelectorAll("ol > li")) as HTMLElement[];
}

describe("StepsSlide visual hierarchy", () => {
  it("active step is highest opacity, completed is dimmed, future is blurred", () => {
    const { container } = render(<RenderSlide slide={SLIDE} step={1} />);
    const [completed, active, future] = rows(container);

    expect(active.style.opacity).toBe("1");
    expect(active.style.filter).toBe("none");

    expect(Number(completed.style.opacity)).toBeLessThan(1);
    expect(completed.style.filter).toBe("none");

    expect(Number(future.style.opacity)).toBeLessThan(Number(completed.style.opacity) + 0.01);
    expect(future.style.filter).toContain("blur(");
  });

  it("default slide foreground token resolves to true white", () => {
    const { container } = render(<RenderSlide slide={SLIDE} step={0} />);
    const root = container.firstElementChild as HTMLElement;
    // unset (root token default) — themeWrap injects only when overridden.
    const fg = root.style.getPropertyValue("--slide-fg");
    // Either unset (uses :root true-white default) or explicitly white via theme preset.
    expect(["", "#ffffff", "oklch(1 0 0)"]).toContain(fg);
  });
});
