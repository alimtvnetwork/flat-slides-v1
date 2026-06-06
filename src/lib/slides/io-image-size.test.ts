import { describe, it, expect } from "vitest";

import { parseDeckJson, parseSlideJson, MAX_DECK_JSON_BYTES } from "./io";
import { MAX_IMAGE_SRC_BYTES, ImageSrcSchema } from "./schema";

describe("image size limits (issue 011)", () => {
  it("ImageSrcSchema accepts http(s) URLs and small data: URLs", () => {
    expect(ImageSrcSchema.safeParse("https://example.com/a.png").success).toBe(true);
    expect(ImageSrcSchema.safeParse(`data:image/png;base64,${"A".repeat(1000)}`).success).toBe(true);
  });

  it("ImageSrcSchema rejects base64 strings over the per-image cap", () => {
    const huge = `data:image/png;base64,${"A".repeat(MAX_IMAGE_SRC_BYTES + 10)}`;
    const r = ImageSrcSchema.safeParse(huge);
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toMatch(/exceeds|hosted URL/);
  });

  it("parseDeckJson bails with a friendly error above the raw JSON byte cap", () => {
    const padding = " ".repeat(MAX_DECK_JSON_BYTES + 10);
    const raw = `{"_":"${padding}"}`;
    const r = parseDeckJson(raw);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/Deck JSON is .* MB \(limit/);
  });

  it("parseSlideJson also enforces the raw JSON byte cap", () => {
    const padding = " ".repeat(MAX_DECK_JSON_BYTES + 10);
    const r = parseSlideJson(`{"_":"${padding}"}`);
    expect(r.ok).toBe(false);
  });
});
