import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ControllerPill } from "./ControllerPill";

/**
 * Issue 015 regression — the overflow menu's Settings/Help items must
 * invoke the callbacks passed via props. A prior refactor renamed the
 * underlying action ids and the menu items became no-ops; this parity
 * test locks that wiring so the symptom can't reappear silently.
 */
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

describe("ControllerOverflowMenu parity (issue 015)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  function setup() {
    mockMatchMedia(1100); // forces narrow → overflow menu rendered
    const root = document.createElement("div");
    root.setAttribute("data-slides-fullscreen-root", "");
    document.body.appendChild(root);
    const onOpenSettings = vi.fn();
    const onOpenHelp = vi.fn();
    render(
      <ControllerPill
        current={1}
        total={3}
        onPrev={noop}
        onNext={noop}
        onJump={noop}
        onOpenGrid={noop}
        onToggleFullscreen={noop}
        onOpenHelp={onOpenHelp}
        onOpenSettings={onOpenSettings}
        isFullscreen={false}
      />,
    );
    return { onOpenSettings, onOpenHelp };
  }

  it("Settings menu item invokes onOpenSettings", async () => {
    const { onOpenSettings } = setup();
    fireEvent.pointerDown(screen.getByLabelText("More controls"));
    const item = await waitFor(() => screen.getByText("Settings"));
    fireEvent.click(item);
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });

  it("Keyboard shortcuts menu item invokes onOpenHelp", async () => {
    const { onOpenHelp } = setup();
    fireEvent.pointerDown(screen.getByLabelText("More controls"));
    const item = await waitFor(() => screen.getByText("Keyboard shortcuts"));
    fireEvent.click(item);
    expect(onOpenHelp).toHaveBeenCalledTimes(1);
  });
});
