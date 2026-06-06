import { readFileSync } from "fs";
import { describe, expect, it } from "vitest";

/**
 * Issue 016 regression — SettingsDrawer must render above the controller
 * pill. We assert the source uses the `--z-drawer` token (not a stale
 * `z-[200]` class) and that the token's value in styles.css is greater
 * than `--z-controller` / `--z-camera`.
 *
 * Source-level assertions only (no React render): SettingsDrawer's full
 * subtree requires a TanStack RouterProvider, which is irrelevant to the
 * z-index contract this test protects.
 */
describe("SettingsDrawer z-index (issue 016)", () => {
  const drawerSrc = readFileSync("src/components/slides/SettingsDrawer.tsx", "utf8");
  const styles = readFileSync("src/styles.css", "utf8");

  it("uses the --z-drawer token and not a stale z-[200] class", () => {
    expect(drawerSrc).toMatch(/var\(--z-drawer\)/);
    expect(drawerSrc).not.toMatch(/z-\[200\]/);
  });

  it("token scale keeps drawer above controller and camera", () => {
    const drawer = Number(/--z-drawer:\s*(\d+)/.exec(styles)?.[1]);
    const controller = Number(/--z-controller:\s*(\d+)/.exec(styles)?.[1]);
    const camera = Number(/--z-camera:\s*(\d+)/.exec(styles)?.[1]);
    expect(drawer).toBeGreaterThan(controller);
    expect(drawer).toBeGreaterThan(camera);
  });
});
