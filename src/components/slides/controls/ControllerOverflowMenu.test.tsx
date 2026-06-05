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
  afterEach(() => vi.restoreAllMocks());

  it("shows inline Settings + Help when viewport is wide (>=1280px)", () => {
    mockMatchMedia(1440);
    render(<ControllerPill {...baseProps} />);
    expect(screen.getByLabelText("Settings")).toBeTruthy();
    expect(screen.getByLabelText("Keyboard shortcuts")).toBeTruthy();
    expect(screen.queryByLabelText("More controls")).not.toBeTruthy();
  });

  it("collapses Settings + Help behind '⋯' on narrow viewports (<1280px)", () => {
    mockMatchMedia(1100);
    render(<ControllerPill {...baseProps} />);
    expect(screen.getByLabelText("More controls")).toBeTruthy();
    expect(screen.queryByLabelText("Settings")).not.toBeTruthy();
    expect(screen.queryByLabelText("Keyboard shortcuts")).not.toBeTruthy();
  });
});
