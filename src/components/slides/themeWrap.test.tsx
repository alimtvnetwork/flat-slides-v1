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

  it("uses the settings image layer behind transparent content", () => {
    act(() => useDeck.getState().setSettings({ backgroundMode: "image", backgroundImage: "/fallback.png" }));
    const { container } = render(<RenderSlide slide={{ ...SLIDE, background: "/authored.png" }} />);

    const root = container.firstElementChild as HTMLElement;
    const layer = container.querySelector("[data-slide-bg-layer]") as HTMLElement;

    expect(root.style.getPropertyValue("--slide-bg")).toBe("transparent");
    expect(layer.style.backgroundImage).toBe('url("/fallback.png")');
    expect(layer.style.backgroundSize).toBe("cover");
    expect(layer.style.backgroundPosition).toBe("center");
  });

  it("falls back to authored image backgrounds when settings has no image", () => {
    act(() => useDeck.getState().setSettings({ backgroundMode: "image", backgroundImage: "" }));
    const { container } = render(<RenderSlide slide={{ ...SLIDE, background: "/authored.png" }} />);

    const layer = container.querySelector("[data-slide-bg-layer]") as HTMLElement;

    expect(layer.style.backgroundImage).toBe('url("/authored.png")');
  });

  it("forces dark tokens regardless of theme when backgroundMode is dark", () => {
    act(() => useDeck.getState().setSettings({ backgroundMode: "dark" }));
    const { container } = render(<RenderSlide slide={{ ...SLIDE, themeId: "paper" }} />);

    const root = container.firstElementChild as HTMLElement;
    expect(root.style.getPropertyValue("--slide-bg")).toBe("#0a0a0a");
    expect(root.style.getPropertyValue("--slide-fg")).toBe("#fafafa");
    expect(root.style.getPropertyValue("--slide-text-shadow")).toBe("none");
  });
});