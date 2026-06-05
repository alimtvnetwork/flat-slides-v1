import { render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { useAudience } from "../audience-store";
import type { Slide } from "../types";
import { PollResultsOverlay } from "./PollResultsOverlay";
import { QrOverlay } from "./QrOverlay";
import { SharePill } from "./SharePill";

const pollSlide = {
  id: "poll-1",
  type: "poll",
  title: "Vote",
  question: "Pick one",
  options: ["A", "B"],
} as Slide;

describe("presenter frame anchored overlays", () => {
  afterEach(() => {
    useAudience.setState({ resultsVisible: false, qrVisible: false });
  });

  it("anchors the share pill to the slide frame top-right, not the viewport", () => {
    const { getByRole } = render(<SharePill current={1} />);

    const share = getByRole("button", { name: /copy share link/i });
    expect(share.getAttribute("data-presenter-frame-anchor")).toBe("top-right");
    expect(share.className).toContain("fixed");
    expect(share.className).not.toContain("absolute");
  });

  it("anchors poll results inside the slide frame", () => {
    useAudience.setState({ resultsVisible: true, polls: { "poll-1": { counts: [1, 0] } } });

    const { getByLabelText } = render(<PollResultsOverlay slide={pollSlide} />);

    const overlay = getByLabelText(/live poll results/i);
    expect(overlay.getAttribute("data-presenter-frame-anchor")).toBe("bottom-left");
    expect(overlay.className).toContain("fixed");
    expect(overlay.className).not.toContain("absolute");
  });

  it("bounds QR overlay to the computed slide frame", () => {
    useAudience.setState({ qrVisible: true });

    const { getByRole } = render(<QrOverlay />);

    const overlay = getByRole("dialog", { name: /join the audience/i });
    expect(overlay.getAttribute("data-presenter-frame-bound")).toBe("true");
    expect(overlay.className).toContain("fixed");
    expect(overlay.className).not.toContain("absolute");
  });
});