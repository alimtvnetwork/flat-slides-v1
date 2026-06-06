/**
 * Regression test for issue 023 — `<mark>` in RichText string segments must
 * be transformed into Highlight objects on import.
 */
import { describe, expect, it } from "vitest";

import { expandMarkHighlights, parseSlideJson } from "./io";

describe("expandMarkHighlights (issue 023)", () => {
  it("splits a string segment containing <mark> into pre/highlight/post parts", () => {
    const result = expandMarkHighlights(["Hello <mark>world</mark>!"]) as unknown[];
    expect(result).toEqual(["Hello ", { text: "world" }, "!"]);
  });

  it("leaves non-RichText arrays untouched", () => {
    const input = [1, 2, 3];
    expect(expandMarkHighlights(input)).toEqual(input);
  });

  it("handles multiple marks and surrounding text", () => {
    const result = expandMarkHighlights([
      "a <mark>B</mark> c <mark>D</mark> e",
    ]) as unknown[];
    expect(result).toEqual(["a ", { text: "B" }, " c ", { text: "D" }, " e"]);
  });

  it("transforms <mark> inside an imported slide and the slide validates", () => {
    const slide = {
      id: "s1",
      title: "Slide One",
      type: "center",
      heading: ["Welcome <mark>back</mark>"],
    };
    const result = parseSlideJson(JSON.stringify(slide));
    expect(result.ok || (result as { errorFull: string }).errorFull).toBe(true);
    if (!result.ok) return;
    const heading = (result.value as { heading: unknown[] }).heading;
    expect(heading).toEqual(["Welcome ", { text: "back" }]);
  });
});
