import type { RichText, Slide, Deck } from "./types";

export type LintSeverity = "warn" | "error";
export interface LintIssue {
  slideId: string;
  slideTitle: string;
  rule: string;
  message: string;
  severity: LintSeverity;
}

const richLen = (r?: RichText) =>
  !r ? 0 : r.reduce((n, p) => n + (typeof p === "string" ? p.length : p.text.length), 0);

/** Pure deck linter — flags overcrowding, missing alt text, empty headings. */
export function lintDeck(deck: Deck): LintIssue[] {
  const out: LintIssue[] = [];
  const push = (s: Slide, rule: string, message: string, severity: LintSeverity = "warn") =>
    out.push({ slideId: s.id, slideTitle: s.title, rule, message, severity });

  for (const s of deck.slides) {
    if (!s.title?.trim()) push(s, "title-missing", "Slide has no title", "error");

    switch (s.type) {
      case "bullets":
        if (s.bullets.length > 6) push(s, "too-many-bullets", `${s.bullets.length} bullets (max 6 recommended)`);
        if (s.bullets.some((b) => richLen(b) > 90))
          push(s, "bullet-too-long", "A bullet exceeds 90 characters — split or trim");
        if (richLen(s.heading) === 0) push(s, "heading-empty", "Bullets slide is missing a heading", "error");
        break;
      case "steps":
        if (s.steps.length > 7) push(s, "too-many-steps", `${s.steps.length} steps (max 7 recommended)`);
        break;
      case "center":
        if (richLen(s.heading) === 0) push(s, "heading-empty", "Center slide is missing a heading", "error");
        if (richLen(s.heading) > 80) push(s, "heading-too-long", "Center heading is very long for a hero slide");
        break;
      case "left":
        if (richLen(s.body) > 320) push(s, "body-too-long", "Body copy is dense (>320 chars) — consider splitting");
        break;
      case "quote":
        if (richLen(s.quote) > 220) push(s, "quote-too-long", "Quote is long — trim for impact");
        if (!s.attribution) push(s, "quote-no-attribution", "Quote has no attribution");
        break;
      case "image":
        if (!s.alt?.trim()) push(s, "image-alt-missing", "Image is missing alt text (a11y)", "error");
        break;
    }
  }
  return out;
}
