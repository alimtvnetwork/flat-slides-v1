import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SlideAriaAnnouncer } from "./SlideAriaAnnouncer";

describe("SlideAriaAnnouncer", () => {
  it("formats slide-only message", () => {
    render(<SlideAriaAnnouncer current={3} total={10} title="Intro" />);
    const region = screen.getByRole("status");
    expect(region.textContent).toBe("Slide 3 of 10: Intro");
    expect(region.getAttribute("aria-live")).toBe("polite");
  });

  it("includes step segment when stepCount > 1", () => {
    render(<SlideAriaAnnouncer current={2} total={5} step={3} stepCount={4} title="Steps" />);
    expect(screen.getByRole("status").textContent).toBe("Slide 2 of 5, step 3 of 4: Steps");
  });

  it("omits step segment when stepCount is 1", () => {
    render(<SlideAriaAnnouncer current={1} total={5} step={1} stepCount={1} title="Solo" />);
    expect(screen.getByRole("status").textContent).toBe("Slide 1 of 5: Solo");
  });

  it("omits title segment when absent", () => {
    render(<SlideAriaAnnouncer current={1} total={2} />);
    expect(screen.getByRole("status").textContent).toBe("Slide 1 of 2");
  });
});
