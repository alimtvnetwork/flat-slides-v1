import { describe, expect, it } from "vitest";

import { classifyDrift, formatDuration } from "./timer-store";

describe("formatDuration", () => {
  it("formats sub-hour as MM:SS", () => {
    expect(formatDuration(0)).toBe("00:00");
    expect(formatDuration(65_000)).toBe("01:05");
    expect(formatDuration(59 * 60_000 + 59_000)).toBe("59:59");
  });

  it("formats >= 1h as H:MM:SS", () => {
    expect(formatDuration(60 * 60_000)).toBe("1:00:00");
    expect(formatDuration(75 * 60_000 + 30_000)).toBe("1:15:30");
  });
});


describe("classifyDrift", () => {
  it("returns 'idle' when no budget", () => {
    expect(classifyDrift(0, undefined)).toBe("idle");
    expect(classifyDrift(10_000, 0)).toBe("idle");
  });
  it("returns ok / warn / over thresholds", () => {
    expect(classifyDrift(50_000, 60)).toBe("ok");   // < 90%
    expect(classifyDrift(55_000, 60)).toBe("warn"); // 91%
    expect(classifyDrift(75_000, 60)).toBe("over"); // 125%
  });
});
