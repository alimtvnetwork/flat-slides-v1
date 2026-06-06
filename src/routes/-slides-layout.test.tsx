import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PresenterWebcamProvider } from "@/components/slides/usePresenterWebcam";

import { SlidesFullscreenRoot } from "./slides";

describe("slides fullscreen layout root", () => {
  it("keeps the native fullscreen target viewport-sized and clipped across slide navigation", () => {
    const { container } = render(
      <PresenterWebcamProvider>
        <SlidesFullscreenRoot>
          <div>slide route outlet</div>
        </SlidesFullscreenRoot>
      </PresenterWebcamProvider>,
    );

    const root = container.querySelector("[data-slides-fullscreen-root]") as HTMLElement;
    expect(root.className).toContain("relative");
    expect(root.className).toContain("h-dvh");
    expect(root.className).toContain("w-full");
    expect(root.className).toContain("overflow-hidden");
  });
});