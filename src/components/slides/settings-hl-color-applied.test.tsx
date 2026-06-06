import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { RenderSlide } from "./RenderSlide";
import { useDeck } from "./store";
import type { CenterSlideProps } from "./types";

const SLIDE: CenterSlideProps = {
  id: "hl-test",
  type: "center",
  title: "HL color test",
  heading: ["HL color test"],
  background: "#000000",
};

describe("settings.hlColor override (plan 04 step 2)", () => {
  afterEach(() => act(() => useDeck.getState().resetDeck()));

  it("overrides --slide-hl when set", () => {
    act(() => useDeck.getState().setSettings({ hlColor: "#ff00aa" }));
    const { container } = render(<RenderSlide slide={{ ...SLIDE, themeId: "paper" }} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.getPropertyValue("--slide-hl")).toBe("#ff00aa");
  });

  it("does not set --slide-hl when cleared (falls back to theme token)", () => {
    act(() => useDeck.getState().setSettings({ hlColor: undefined }));
    const { container } = render(<RenderSlide slide={{ ...SLIDE, themeId: "midnight" }} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.getPropertyValue("--slide-hl")).toBe("");
  });
});
