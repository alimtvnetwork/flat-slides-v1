import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { RenderSlide } from "./RenderSlide";
import { useDeck } from "./store";
import type { CenterSlideProps } from "./types";

const SLIDE: CenterSlideProps = {
  id: "theme-wrap-test",
  type: "center",
  title: "Theme Wrap Test",
  heading: ["Theme Wrap Test"],
  background: "#ffffff",
};

describe("ThemeWrap background pipeline", () => {
  afterEach(() => act(() => useDeck.getState().resetDeck()));

  it("lets the settings color override authored slide backgrounds", () => {
    act(() => useDeck.getState().setSettings({ backgroundMode: "color", backgroundColor: "#224466" }));
    const { container } = render(<RenderSlide slide={SLIDE} />);

    const root = container.firstElementChild as HTMLElement;
    const layer = container.querySelector("[data-slide-bg-layer]") as HTMLElement;

    expect(root.style.getPropertyValue("--slide-bg")).toBe("#224466");
    expect(root.style.getPropertyValue("--slide-content-bg")).toBe("transparent");
    expect(layer.style.background).toContain("34, 68, 102");
  });

  it("keeps image-mode authored backgrounds behind transparent content", () => {
    act(() => useDeck.getState().setSettings({ backgroundMode: "image", backgroundImage: "/fallback.png" }));
    const { container } = render(<RenderSlide slide={{ ...SLIDE, background: "/authored.png" }} />);

    const root = container.firstElementChild as HTMLElement;
    const layer = container.querySelector("[data-slide-bg-layer]") as HTMLElement;

    expect(root.style.getPropertyValue("--slide-bg")).toBe("transparent");
    expect(layer.style.backgroundImage).toBe('url("/authored.png")');
  });
});