import { describe, expect, it } from "vitest";
import { unzipSync, strFromU8 } from "fflate";

// Inline-loaded LLM spec files — same imports the SettingsDrawer uses.
// If Vite ever drops `?raw` resolution for these paths, this test fails before
// the user can ever see a toast.error. Issue 03 / v1.29.0 download path.
import sampleDeckJson from "../../../docs/slides/spec/sample-deck.json?raw";
import llmGuidelineMd from "../../../docs/slides/spec/llm-json-guideline.md?raw";

describe("LLM guide ZIP payload", () => {
  it("raw imports resolve to non-empty strings", () => {
    expect(typeof sampleDeckJson).toBe("string");
    expect(typeof llmGuidelineMd).toBe("string");
    expect(sampleDeckJson.length).toBeGreaterThan(100);
    expect(llmGuidelineMd.length).toBeGreaterThan(100);
  });

  it("sample-deck.json is valid JSON", () => {
    expect(() => JSON.parse(sampleDeckJson)).not.toThrow();
  });

  it("zip round-trips via fflate with the three expected entries", async () => {
    const { zipSync, strToU8 } = await import("fflate");
    const zipped = zipSync({
      "README.txt": strToU8("test readme"),
      "llm-json-guideline.md": strToU8(llmGuidelineMd),
      "sample-deck.json": strToU8(sampleDeckJson),
    });
    expect(zipped.byteLength).toBeGreaterThan(0);

    const unzipped = unzipSync(zipped);
    expect(Object.keys(unzipped).sort()).toEqual([
      "README.txt",
      "llm-json-guideline.md",
      "sample-deck.json",
    ]);
    expect(strFromU8(unzipped["sample-deck.json"])).toBe(sampleDeckJson);
    expect(strFromU8(unzipped["llm-json-guideline.md"])).toBe(llmGuidelineMd);
  });
});
