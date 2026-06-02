import type { RichText, Slide, Deck } from "./types";

export type LintSeverity = "warn" | "error";
export interface LintIssue {
  slideId: string;
  slideIndex: number;
  slideTitle: string;
  rule: string;
  message: string;
  severity: LintSeverity;
}

const richLen = (r?: RichText) =>
  !r ? 0 : r.reduce((n, p) => n + (typeof p === "string" ? p.length : p.text.length), 0);

/** Pure deck linter — flags overcrowding, missing alt text, empty headings, number collisions. */
export function lintDeck(deck: Deck): LintIssue[] {
  const out: LintIssue[] = [];
  const push = (s: Slide, i: number, rule: string, message: string, severity: LintSeverity = "warn") =>
    out.push({ slideId: s.id, slideIndex: i, slideTitle: s.title, rule, message, severity });

  // Collision detection on authored slide.number
  const seen = new Map<number, string>();
  for (let i = 0; i < deck.slides.length; i++) {
    const s = deck.slides[i];
    if (typeof s.number !== "number") continue;
    const prior = seen.get(s.number);
    if (prior) {
      push(s, i, "number-collision", `Authored number ${s.number} duplicates slide "${prior}"`, "warn");
    } else {
      seen.set(s.number, s.title || s.id);
    }
  }

  for (let i = 0; i < deck.slides.length; i++) {
    const s = deck.slides[i];
    if (!s.title?.trim()) push(s, i, "title-missing", "Slide has no title", "error");

    switch (s.type) {
      case "bullets":
        if (s.bullets.length > 6) push(s, i, "too-many-bullets", `${s.bullets.length} bullets (max 6 recommended)`);
        if (s.bullets.some((b) => richLen(b) > 90))
          push(s, i, "bullet-too-long", "A bullet exceeds 90 characters — split or trim");
        if (richLen(s.heading) === 0) push(s, i, "heading-empty", "Bullets slide is missing a heading", "error");
        break;
      case "steps":
        if (s.steps.length > 7) push(s, i, "too-many-steps", `${s.steps.length} steps (max 7 recommended)`);
        if (s.steps.some((step) => !step.label?.trim())) push(s, i, "step-label-missing", "A step is missing its label", "error");
        if (s.steps.some((step) => richLen(step.detail) === 0)) push(s, i, "step-detail-missing", "A step is missing detail text", "error");
        break;
      case "timeline":
        if (s.items.length > 6) push(s, i, "timeline-too-many", `${s.items.length} milestones (max 6 recommended)`);
        if (s.items.some((it) => !it.label?.trim())) push(s, i, "timeline-empty-item", "Timeline item is missing a label", "error");
        if (s.items.every((it) => !it.detail || richLen(it.detail) === 0))
          push(s, i, "timeline-no-detail", "No timeline item has detail text — centre area will be empty");
        break;
      case "center":
        if (richLen(s.heading) === 0) push(s, i, "heading-empty", "Center slide is missing a heading", "error");
        if (richLen(s.heading) > 80) push(s, i, "heading-too-long", "Center heading is very long for a hero slide");
        break;
      case "left":
        if (richLen(s.body) > 320) push(s, i, "body-too-long", "Body copy is dense (>320 chars) — consider splitting");
        break;
      case "quote":
        if (richLen(s.quote) > 220) push(s, i, "quote-too-long", "Quote is long — trim for impact");
        if (!s.attribution) push(s, i, "quote-no-attribution", "Quote has no attribution");
        break;
      case "image":
        if (!s.alt?.trim()) push(s, i, "image-alt-missing", "Image is missing alt text (a11y)", "error");
        break;
    }
  }
  return out;
}
