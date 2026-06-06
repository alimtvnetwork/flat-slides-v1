import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SettingsDrawer } from "./SettingsDrawer";

/**
 * Issue 016 regression — SettingsDrawer must render above the controller
 * pill. We assert it uses the `--z-drawer` token (not a stale `z-[200]`
 * class) and that the resolved numeric value is greater than the
 * controller pill's `--z-controller`.
 */
describe("SettingsDrawer z-index (issue 016)", () => {
  it("uses the --z-drawer token", () => {
    const { container } = render(<SettingsDrawer open onClose={() => {}} />);
    const root = container.querySelector('[data-app-chrome]') as HTMLElement | null;
    expect(root).not.toBeNull();
    // jsdom resolves CSS vars to the literal string we wrote inline.
    expect(root!.style.zIndex).toBe("var(--z-drawer)");
    // The class must NOT include the stale literal.
    expect(root!.className).not.toMatch(/z-\[200\]/);
  });

  it("token scale keeps drawer above controller", async () => {
    // Read the literal token values from styles.css so a future edit
    // that lowers --z-drawer below --z-controller fails this test.
    const css = await import("fs").then((m) =>
      m.readFileSync("src/styles.css", "utf8"),
    );
    const drawer = Number(/--z-drawer:\s*(\d+)/.exec(css)?.[1]);
    const controller = Number(/--z-controller:\s*(\d+)/.exec(css)?.[1]);
    const camera = Number(/--z-camera:\s*(\d+)/.exec(css)?.[1]);
    expect(drawer).toBeGreaterThan(controller);
    expect(drawer).toBeGreaterThan(camera);
  });
});
