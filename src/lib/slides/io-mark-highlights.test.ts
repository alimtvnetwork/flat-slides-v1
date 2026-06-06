/**
 * Regression test for issue 023 — `<mark>` in RichText string segments must
 * be transformed into Highlight objects on import.
 */
import { describe, expect, it } from "vitest";

import { expandMarkHighlights, parseDeckJson } from "./io";

describe("expandMarkHighlights (issue 023)", () => {
  it("splits a string segment containing <mark> into pre/highlight/post parts", () => {
    const result = expandMarkHighlights(["Hello <mark>world</mark>!"]) as unknown[];
    expect(result).toEqual(["Hello ", { text: "world" }, "!"]);
  });

  it("leaves non-RichText arrays untouched", () => {
    const input = [1, 2, 3];
    expect(expandMarkHighlights(input)).toEqual(input);
  });

  it("transforms <mark> inside an imported deck and the deck validates", () => {
    const deck = {
      id: "d",
      title: "T",
      version: 1,
      settings: {},
      slides: [
        {
          id: "s1",
          title: "Slide One",
          type: "center",
          heading: ["Welcome <mark>back</mark>"],
        },
      ],
    };
    const result = parseDeckJson(JSON.stringify(deck));
    expect(result.ok || (result as { errorFull: string }).errorFull).toBe(true);
    if (!result.ok) return;
    const heading = (result.value.slides[0] as { heading: unknown[] }).heading;
    expect(heading).toEqual(["Welcome ", { text: "back" }]);
  });
});
