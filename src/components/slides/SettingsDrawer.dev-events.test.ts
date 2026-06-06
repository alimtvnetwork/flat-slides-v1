import { readFileSync } from "fs";
import { describe, expect, it } from "vitest";

describe("SettingsDrawer dev telemetry panel", () => {
  const source = readFileSync("src/components/slides/SettingsDrawer.tsx", "utf8");

  it("mounts the event buffer viewer only inside the dev section", () => {
    expect(source).toMatch(/import\.meta\.env\.DEV[\s\S]*<DevSlidesEventsPanel \/>/);
  });
});