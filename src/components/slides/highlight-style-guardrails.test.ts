import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Locks `.lovable/strictly-avoid.md` rules in CSS so a future refactor
// cannot reintroduce a glow on yellow highlights or drift the default
// slide foreground off of true white.
const css = readFileSync(resolve(__dirname, "../../styles.css"), "utf8");

function ruleBody(selector: string): string {
  const re = new RegExp(`${selector.replace(/[.\\]/g, (m) => "\\" + m)}\\s*\\{([^}]*)\\}`);
  const match = css.match(re);
  if (!match) throw new Error(`selector ${selector} not found in src/styles.css`);
  return match[1];
}

describe("slide design-token guardrails", () => {
  it("default --slide-fg root token is true white", () => {
    // Look at the :root declaration (first one) for --slide-fg.
    const match = css.match(/--slide-fg:\s*([^;]+);/);
    expect(match).not.toBeNull();
    expect(match![1].trim()).toMatch(/oklch\(\s*1\s+0\s+0\s*\)|#ffffff/i);
  });

  it(".hl uses the exact ink-stamp text-shadow with no glow/blur/filter", () => {
    const body = ruleBody(".hl");
    expect(body).toMatch(/text-shadow:\s*rgb\(0 0 0\)\s+1px\s+0\.7px\s+0px/);
    expect(body).not.toMatch(/filter\s*:/);
    expect(body).not.toMatch(/blur\(/);
    expect(body).not.toMatch(/drop-shadow\(/);
    // box-shadow on inline highlight would read as a glow halo.
    expect(body).not.toMatch(/box-shadow\s*:/);
  });
});
