import { describe, expect, it } from "vitest";

import sampleDeck from "../../../docs/slides/spec/sample-deck.json";
import { DeckSchema } from "./schema";

describe("docs/slides/spec/sample-deck.json", () => {
  it("parses against DeckSchema", () => {
    const result = DeckSchema.safeParse(sampleDeck);
    if (!result.success) {
      // Surface a readable error in CI output.
      throw new Error(JSON.stringify(result.error.format(), null, 2));
    }
    expect(result.success).toBe(true);
    expect(result.data.slides.length).toBeGreaterThan(0);
  });
});
