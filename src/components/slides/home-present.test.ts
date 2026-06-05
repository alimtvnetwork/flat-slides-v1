import { describe, expect, it } from "vitest";

import { getHomePresentUrl } from "./home-present";

describe("home presenter launcher", () => {
  it("opens the first slide with presenter auto-start armed", () => {
    expect(getHomePresentUrl("https://deck.test")).toBe("https://deck.test/slides/1?present=1");
  });
});