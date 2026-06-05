import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ControllerPill } from "./ControllerPill";

function mockMatchMedia(maxWidth: number) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => {
      const m = query.match(/max-width:\s*(\d+)px/);
      const limit = m ? Number(m[1]) : 0;
      return {
        matches: maxWidth <= limit,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      };
    },
  });
}

const noop = () => {};
const baseProps = {
  current: 1,
  total: 3,
  onPrev: noop,
  onNext: noop,
  onJump: noop,
  onOpenGrid: noop,
  onToggleFullscreen: noop,
  onOpenHelp: noop,
  onOpenSettings: noop,
  isFullscreen: false,
};

describe("ControllerPill overflow menu", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  function createSlidesRoot() {
    const root = document.createElement("div");
    root.setAttribute("data-slides-fullscreen-root", "");
    document.body.appendChild(root);
  }

  it("keeps presenter mode to navigation plus fullscreen on wide viewports", () => {
    mockMatchMedia(1440);
    createSlidesRoot();
    render(<ControllerPill {...baseProps} />);

    expect(screen.getByLabelText("Previous slide")).toBeTruthy();
    expect(screen.getByLabelText("Jump to slide. Current 1 of 3")).toBeTruthy();
    expect(screen.getByLabelText("Next slide")).toBeTruthy();
    expect(screen.getByLabelText("Enter fullscreen")).toBeTruthy();
    expect(screen.queryByLabelText("Settings")).not.toBeTruthy();
    expect(screen.queryByLabelText("Keyboard shortcuts")).not.toBeTruthy();
    expect(screen.queryByLabelText("More controls")).not.toBeTruthy();
  });

  it("does not add overflow chrome on narrow viewports", () => {
    mockMatchMedia(1100);
    createSlidesRoot();
    render(<ControllerPill {...baseProps} />);

    expect(screen.getByLabelText("Previous slide")).toBeTruthy();
    expect(screen.getByLabelText("Next slide")).toBeTruthy();
    expect(screen.queryByLabelText("More controls")).not.toBeTruthy();
    expect(screen.queryByLabelText("Settings")).not.toBeTruthy();
    expect(screen.queryByLabelText("Keyboard shortcuts")).not.toBeTruthy();
  });
});
