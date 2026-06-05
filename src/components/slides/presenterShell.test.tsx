import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PresenterShell, SlideStageShell } from "./PresenterShell";

describe("PresenterShell containment", () => {
  it("stays in the fullscreen root flow so the stable root clips it", () => {
    const { container } = render(
      <PresenterShell isFullscreen>
        <SlideStageShell>
          <div />
        </SlideStageShell>
      </PresenterShell>,
    );

    const shell = container.querySelector("[data-slide-presenter-root]") as HTMLElement;
    const stage = container.querySelector("[data-slide-stage-shell]") as HTMLElement;

    expect(shell.dataset.fullscreen).toBe("true");
    expect(shell.className).not.toContain("fixed");
    expect(shell.className).not.toContain("inset-0");
    expect(shell.className).toContain("w-full");
    expect(shell.className).not.toContain("w-screen");
    expect(shell.className).toContain("overflow-hidden");
    expect(stage.className).toContain("min-h-0");
    expect(stage.className).toContain("overflow-hidden");
  });

  it("keeps normal slide routes viewport-sized without fixed positioning", () => {
    const { container } = render(<PresenterShell isFullscreen={false}>slide</PresenterShell>);
    const shell = container.querySelector("[data-slide-presenter-root]") as HTMLElement;

    expect(shell.dataset.fullscreen).toBe("false");
    expect(shell.className).toContain("h-dvh");
    expect(shell.className).not.toContain("fixed");
  });
});