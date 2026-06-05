import { render, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ControllerPill } from "./ControllerPill";

const noop = () => {};

const baseProps = {
  total: 3,
  onPrev: noop,
  onNext: noop,
  onJump: noop,
  onOpenGrid: noop,
  onToggleFullscreen: noop,
  onOpenHelp: noop,
  onOpenSettings: noop,
  isFullscreen: false,
  canPrev: true,
  canNext: true,
};

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

function createSlidesRoot() {
  const root = document.createElement("div");
  root.setAttribute("data-slides-fullscreen-root", "");
  document.body.appendChild(root);
  return root;
}

describe("ControllerPill mount audit (B21/step 22)", () => {
  it("renders exactly one toolbar with position:fixed", () => {
    createSlidesRoot();
    render(<ControllerPill current={1} {...baseProps} />);
    const toolbars = document.querySelectorAll('[aria-label="Slide controller"]');
    expect(toolbars).toHaveLength(1);
    expect((toolbars[0] as HTMLElement).style.position).toBe("fixed");
  });

  it("does not multiply across slide/step prop changes (simulated /N ↔ /N/S)", () => {
    createSlidesRoot();
    const { rerender } = render(<ControllerPill current={1} {...baseProps} />);
    rerender(<ControllerPill current={2} {...baseProps} />);
    rerender(<ControllerPill current={2} {...baseProps} canPrev={true} canNext={false} />);
    expect(document.querySelectorAll('[aria-label="Slide controller"]')).toHaveLength(1);
  });

  it("portals into the slides fullscreen root when present", () => {
    const root = createSlidesRoot();
    render(<ControllerPill current={1} {...baseProps} />);
    expect(root.querySelector('[aria-label="Slide controller"]')).not.toBeNull();
    root.remove();
  });

  it("renders inline instead of disappearing when the slides root is not mounted yet", () => {
    render(<ControllerPill current={1} {...baseProps} />);
    expect(document.querySelectorAll('[aria-label="Slide controller"]')).toHaveLength(1);
  });
});
