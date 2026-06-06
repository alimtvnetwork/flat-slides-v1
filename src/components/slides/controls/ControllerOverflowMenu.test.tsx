import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

  it("shows settings directly on wide viewports", () => {
    mockMatchMedia(1440);
    createSlidesRoot();
    render(<ControllerPill {...baseProps} />);

    expect(screen.getByLabelText("Previous slide")).toBeTruthy();
    expect(screen.getByLabelText("Jump to slide. Current 1 of 3")).toBeTruthy();
    expect(screen.getByLabelText("Next slide")).toBeTruthy();
    expect(screen.getByLabelText("Enter fullscreen")).toBeTruthy();
    expect(screen.getByLabelText("Settings")).toBeTruthy();
    expect(screen.queryByLabelText("Keyboard shortcuts")).not.toBeTruthy();
    expect(screen.queryByLabelText("More controls")).not.toBeTruthy();
  });

  it("keeps settings reachable from overflow on narrow viewports", async () => {
    mockMatchMedia(1100);
    createSlidesRoot();
    render(<ControllerPill {...baseProps} />);

    expect(screen.getByLabelText("Previous slide")).toBeTruthy();
    expect(screen.getByLabelText("Next slide")).toBeTruthy();
    fireEvent.pointerDown(screen.getByLabelText("More controls"));
    await waitFor(() => expect(screen.getByText("Settings")).toBeTruthy());
    expect(screen.getByText("Keyboard shortcuts")).toBeTruthy();
    expect(screen.getByText("Open in new window")).toBeTruthy();
  });

  it("opens a presenter popup when 'Open in new window' is selected", async () => {
    mockMatchMedia(1100);
    createSlidesRoot();
    const opened = { focus: vi.fn(), opener: {} } as unknown as Window;
    const openSpy = vi.spyOn(window, "open").mockReturnValue(opened);
    render(<ControllerPill {...baseProps} />);

    fireEvent.pointerDown(screen.getByLabelText("More controls"));
    await waitFor(() => expect(screen.getByText("Open in new window")).toBeTruthy());
    fireEvent.click(screen.getByText("Open in new window"));

    expect(openSpy).toHaveBeenCalledTimes(1);
    const [, target] = openSpy.mock.calls[0]!;
    expect(target).toBe("_blank");
  });
});
