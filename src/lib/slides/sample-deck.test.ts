import { describe, expect, it } from "vitest";

import sampleDeckParsed from "../../../docs/slides/spec/sample-deck.json";
// `?raw` mirrors how SettingsDrawer loads the sample (string, no
// build-time JSON parse). If the file ever drifts (comments, trailing
// commas, schema-breaking changes), this lock fails BEFORE the user
// sees an error toast.
import sampleDeckRaw from "../../../docs/slides/spec/sample-deck.json?raw";

import { parseDeckJson } from "./io";
import { DeckSchema } from "./schema";

describe("docs/slides/spec/sample-deck.json", () => {
  it("parses against DeckSchema (structural)", () => {
    const result = DeckSchema.safeParse(sampleDeckParsed);
    if (!result.success) {
      throw new Error(JSON.stringify(result.error.format(), null, 2));
    }
    expect(result.success).toBe(true);
    expect(result.data.slides.length).toBeGreaterThan(0);
  });

  it("survives the raw → parseDeckJson pipeline used by SettingsDrawer (issue 013)", () => {
    const out = parseDeckJson(sampleDeckRaw);
    if (!out.ok) {
      throw new Error(`Sample deck failed parseDeckJson:\n${out.errorFull}`);
    }
    expect(out.value.slides.length).toBeGreaterThan(0);
    expect(out.value.settings).toBeDefined();
  });
});
