/**
 * Decode common HTML entities so authors can paste copy like
 * `R&amp;D &mdash; 2026` into deck JSON without seeing literal ampersands.
 * Kept tiny and SSR-safe: no DOM access, no third-party deps.
 */
const NAMED: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: "\u00a0",
  mdash: "\u2014",
  ndash: "\u2013",
  hellip: "\u2026",
  copy: "\u00a9",
  reg: "\u00ae",
  trade: "\u2122",
  laquo: "\u00ab",
  raquo: "\u00bb",
  ldquo: "\u201c",
  rdquo: "\u201d",
  lsquo: "\u2018",
  rsquo: "\u2019",
};

export function decodeEntities(input: string): string {
  if (!input.includes("&")) return input;
  return input.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|[a-zA-Z]+);/g, (m, body: string) => {
    if (body[0] === "#") {
      const code = body[1] === "x" || body[1] === "X"
        ? parseInt(body.slice(2), 16)
        : parseInt(body.slice(1), 10);
      if (!Number.isFinite(code)) return m;
      try { return String.fromCodePoint(code); } catch (e) {
        console.warn("decodeEntities: bad code point", body, e);
        return m;
      }
    }
    return NAMED[body] ?? m;
  });
}
