import { describe, expect, it } from "vitest";

import { buildPaginationSlots } from "./pagination";

const labels = (current: number, total: number, threshold = 15) =>
  buildPaginationSlots(current, total, threshold).map((slot) =>
    slot.kind === "number" ? String(slot.n) : "…",
  );

describe("buildPaginationSlots", () => {
  it.each([
    [12, 5, ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]],
    [20, 1, ["1", "2", "3", "…", "20"]],
    [20, 10, ["1", "…", "8", "9", "10", "11", "12", "…", "20"]],
    [20, 19, ["1", "…", "17", "18", "19", "20"]],
    [20, 4, ["1", "2", "3", "4", "5", "6", "…", "20"]],
    [20, 17, ["1", "…", "15", "16", "17", "18", "19", "20"]],
    [30, 15, ["1", "…", "13", "14", "15", "16", "17", "…", "30"]],
  ])("matches the spec examples for total %i current %i", (total, current, expected) => {
    expect(labels(current, total)).toEqual(expected);
  });

  it("never hides a single slide behind an ellipsis", () => {
    const slots = buildPaginationSlots(5, 9, 5);
    expect(slots).toEqual([
      { kind: "number", n: 1 },
      { kind: "number", n: 2 },
      { kind: "number", n: 3 },
      { kind: "number", n: 4 },
      { kind: "number", n: 5 },
      { kind: "number", n: 6 },
      { kind: "number", n: 7 },
      { kind: "ellipsis", id: "right", range: [8, 8] },
      { kind: "number", n: 9 },
    ]);
  });
});