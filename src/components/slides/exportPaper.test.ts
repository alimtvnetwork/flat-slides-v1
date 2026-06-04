import { describe, expect, it } from "vitest";

import { exportUrl, parseExportPaper } from "./exportPaper";

describe("export paper helpers", () => {
  it("parses supported paper values and falls back to wide", () => {
    expect(parseExportPaper("?paper=wide")).toBe("wide");
    expect(parseExportPaper("?paper=letter")).toBe("letter");
    expect(parseExportPaper("?paper=a4")).toBe("a4");
    expect(parseExportPaper("?paper=tabloid")).toBe("wide");
    expect(parseExportPaper("")).toBe("wide");
  });

  it("builds backward-compatible auto export URLs", () => {
    expect(exportUrl("/slides/print", "wide")).toBe("/slides/print?auto=1");
    expect(exportUrl("/slides/handout", "letter")).toBe("/slides/handout?auto=1&paper=letter");
    expect(exportUrl("/slides/handout-3up", "a4")).toBe("/slides/handout-3up?auto=1&paper=a4");
  });
});
