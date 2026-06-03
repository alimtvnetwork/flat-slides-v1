import { describe, expect, it } from "vitest";

import { emitSlidesEvent, onSlidesEvent, type SlidesEventDetail } from "./telemetry";

describe("telemetry — lint-issue-clicked", () => {
  it("round-trips a lint-issue-clicked event", () => {
    const received: SlidesEventDetail[] = [];
    const off = onSlidesEvent((d) => received.push(d));
    emitSlidesEvent({ type: "lint-issue-clicked", rule: "quote-too-long", severity: "warn", slideId: "q" });
    off();
    expect(received).toHaveLength(1);
    expect(received[0]).toMatchObject({ type: "lint-issue-clicked", rule: "quote-too-long", severity: "warn", slideId: "q" });
  });
});
