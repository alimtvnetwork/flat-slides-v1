import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * Regression lock for spec/issues/005-camera-bubble-never-mounted.md
 *
 * `CameraBubble` self-gates on `useChrome.camera.visible`, but it was never
 * mounted in any production route — so toggling "Show camera" in Settings
 * had no visible effect. This test asserts the mount site exists in
 * `SlidePresenterPage` and that the import is wired. If a future refactor
 * removes either, the test fails before the regression ships.
 */
describe("CameraBubble mount in SlidePresenterPage", () => {
  const source = readFileSync(
    new URL("./SlidePresenterPage.tsx", import.meta.url),
    "utf8",
  );

  it("imports CameraBubble from the controls barrel", () => {
    expect(source).toMatch(
      /import\s*\{\s*CameraBubble\s*\}\s*from\s*["']@\/components\/slides\/controls\/CameraBubble["'];?/,
    );
  });

  it("renders <CameraBubble /> inside the presenter shell", () => {
    expect(source).toContain("<CameraBubble />");
  });
});
