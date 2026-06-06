import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Regression guard for `.lovable/memory/avoid/02-no-hl-glow.md`.
 *
 * `.hl-pill` previously carried a 40px-blur drop shadow that read as a glow on
 * dark slide backgrounds. The visual contract is: crisp ink-drop only.
 * If anyone reintroduces a blurred shadow on `.hl` or `.hl-pill`, fail loudly.
 */
describe(".hl / .hl-pill — no-glow contract", () => {
  const css = readFileSync(resolve(__dirname, "../../styles.css"), "utf8");

  function extractBlock(selector: string): string {
    const re = new RegExp(`${selector.replace(".", "\\.")}\\s*\\{([^}]*)\\}`);
    const m = css.match(re);
    if (!m) throw new Error(`selector ${selector} not found in styles.css`);
    return m[1];
  }

  function shadowBlurPxValues(block: string): number[] {
    const shadowMatch = block.match(/box-shadow\s*:\s*([^;]+);/);
    if (!shadowMatch) return [];
    // Each shadow: x y blur [spread] color. Take the 3rd token (blur) per layer.
    return shadowMatch[1]
      .split(/,(?![^(]*\))/)
      .map((layer) => {
        const tokens = layer.trim().split(/\s+/);
        // tokens[0] = x, tokens[1] = y, tokens[2] = blur
        const blur = tokens[2] ?? "0";
        const px = Number.parseFloat(blur);
        return Number.isFinite(px) ? px : 0;
      });
  }

  it(".hl-pill has no blurred box-shadow (crisp ink-drop only, blur <= 2px)", () => {
    const blurs = shadowBlurPxValues(extractBlock(".hl-pill"));
    for (const b of blurs) {
      expect(b, `blur ${b}px exceeds crisp ink-drop cap`).toBeLessThanOrEqual(2);
    }
  });

  it(".hl has no box-shadow blur (highlighter stays flat)", () => {
    const blurs = shadowBlurPxValues(extractBlock(".hl"));
    for (const b of blurs) {
      expect(b).toBeLessThanOrEqual(2);
    }
  });
});
