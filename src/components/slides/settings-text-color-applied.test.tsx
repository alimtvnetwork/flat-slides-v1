import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { RenderSlide } from "./RenderSlide";
import { useDeck } from "./store";
import type { CenterSlideProps } from "./types";

const SLIDE: CenterSlideProps = {
  id: "tc-test",
  type: "center",
  title: "Text color test",
  heading: ["Text color test"],
  background: "#000000",
};

describe("settings.textColor override (issue 003)", () => {
  afterEach(() => act(() => useDeck.getState().resetDeck()));

  it("overrides theme.fg on --slide-fg when set", () => {
    act(() => useDeck.getState().setSettings({ textColor: "#ff00aa" }));
    const { container } = render(<RenderSlide slide={{ ...SLIDE, themeId: "paper" }} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.getPropertyValue("--slide-fg")).toBe("#ff00aa");
  });

  it("falls back to theme.fg when textColor is cleared", () => {
    act(() => useDeck.getState().setSettings({ textColor: undefined }));
    const { container } = render(<RenderSlide slide={{ ...SLIDE, themeId: "midnight" }} />);
    const root = container.firstElementChild as HTMLElement;
    // midnight theme fg is white
    expect(root.style.getPropertyValue("--slide-fg")).toBe("#ffffff");
  });
});
