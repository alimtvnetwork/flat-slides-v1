import { DECK_SCHEMA_VERSION } from "@/lib/slides/version";

import { THEMES } from "./themes";
import { slideStepCount } from "./types";
import type { RichText, Slide, Deck } from "./types";


/** Parse `#rgb` / `#rrggbb` to [r,g,b] in 0..255, or null. */
function parseHex(c: string): [number, number, number] | null {
  if (typeof c !== "string") return null;
  const m = c.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return null;
  const h = m[1].length === 3 ? m[1].split("").map((x) => x + x).join("") : m[1];
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function relLuminance([r, g, b]: [number, number, number]): number {
  const f = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/** WCAG 2.x contrast ratio (1..21). Returns null if either color isn't hex. */
export function contrastRatio(a: string, b: string): number | null {
  const ra = parseHex(a);
  const rb = parseHex(b);
  if (!ra || !rb) return null;
  const la = relLuminance(ra);
  const lb = relLuminance(rb);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}


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

  // Deck-level: must have at least one slide.
  if (deck.slides.length === 0) {
    out.push({
      slideId: "", slideIndex: 0, slideTitle: "",
      rule: "empty-deck",
      message: "Deck has no slides — add at least one to render anything.",
      severity: "error",
    });
    return out;
  }

  // Deck-level: warn on very long decks (cognitive load + nav UX).
  if (deck.slides.length > 60) {
    push(deck.slides[0], 0, "deck-too-long",
      `Deck has ${deck.slides.length} slides — split into shorter chapters; nav and rendering degrade past ~60.`,
      "warn");
  }

  // Deck-level: more than one Q&A slide is usually a copy/paste mistake.
  const qaCount = deck.slides.filter((s) => s.type === "qa").length;
  if (qaCount > 1) {
    const first = deck.slides.findIndex((s) => s.type === "qa");
    push(deck.slides[first], first, "multiple-qa-slides",
      `Deck has ${qaCount} Q&A slides — usually only the final slide should be a Q&A.`,
      "warn");
  }

  // Deck-level: title must be present and not the default "Untitled".
  if (deck.slides[0]) {
    const t = deck.title?.trim() ?? "";
    if (!t || /^untitled$/i.test(t)) {
      push(deck.slides[0], 0, "deck-title-untitled",
        `Deck title is "${t || "(empty)"}" — set a real title; it shows in tab labels and exports.`,
        "warn");
    }
  }

  // Deck-level: volume must be a sane 0..1 number.
  if (
    typeof deck.settings.volume === "number" &&
    (deck.settings.volume < 0 || deck.settings.volume > 1)
  ) {
    const anchor = deck.slides[0];
    if (anchor) {
      push(anchor, 0, "volume-out-of-range",
        `Deck volume ${deck.settings.volume} is outside [0, 1] — audio API will clamp or error.`,
        "warn");
    }
  }

  // Deck-level: darken/blur sliders should be in [0, 1].
  const anchor0 = deck.slides[0];
  if (anchor0) {
    const d = deck.settings.darken;
    if (typeof d === "number" && (d < 0 || d > 1))
      push(anchor0, 0, "darken-out-of-range",
        `Deck darken=${d} is outside [0, 1] — overlay will clamp.`, "warn");
    const b = deck.settings.blur;
    if (typeof b === "number" && (b < 0 || b > 1))
      push(anchor0, 0, "blur-out-of-range",
        `Deck blur=${b} is outside [0, 1] — backdrop-filter will clamp.`, "warn");
    const bg = deck.settings.backgroundColor;
    if (deck.settings.backgroundMode === "color" && typeof bg === "string"
        && bg.trim() && !/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(bg.trim()))
      push(anchor0, 0, "backgroundColor-not-hex",
        `Deck backgroundColor "${bg}" is not a #rgb / #rrggbb hex — contrast lint can't verify.`, "warn");
  }


  // Deck-level music sanity (B18).
  if (deck.music?.url && !/^https:\/\//i.test(deck.music.url) && !deck.music.url.startsWith("/")) {
    const anchor = deck.slides[0];
    if (anchor) push(anchor, 0, "music-url-not-https",
      `Deck music URL "${deck.music.url}" must be https:// or an absolute path.`, "warn");
  }
  if (deck.music && typeof deck.music.volume === "number" &&
      (deck.music.volume < 0 || deck.music.volume > 1)) {
    const anchor = deck.slides[0];
    if (anchor) push(anchor, 0, "music-volume-out-of-range",
      `Deck music volume ${deck.music.volume} is outside [0, 1].`, "warn");
  }

  // Deck-level: total budget sanity — sum of slide budgets shouldn't exceed
  // a typical talk slot (1 hour). Warn so presenters notice runaway pacing.
  const totalBudget = deck.slides.reduce(
    (n, s) => n + (typeof s.budget === "number" && s.budget > 0 ? s.budget : 0),
    0,
  );
  if (totalBudget > 3600 && deck.slides[0]) {
    push(deck.slides[0], 0, "deck-runtime-too-long",
      `Total slide budget is ${Math.round(totalBudget / 60)} min (>60 min) — split into multiple decks.`,
      "warn");
  }

  // Deck-level: weak opener — first slide should not be a quote.
  if (deck.slides[0]?.type === "quote") {
    push(deck.slides[0], 0, "quote-first-slide",
      "First slide is a quote — quotes land better after context. Open with a title or hero.",
      "warn");
  }

  // Deck-level: deck.themeId must resolve to a real theme.
  if (deck.themeId && !THEMES.some((t) => t.id === deck.themeId)) {
    push(deck.slides[0], 0, "deck-theme-unknown",
      `Deck themeId "${deck.themeId}" does not match any built-in theme.`, "warn");
  }
  // Deck-level: no themeId at all → inherits default; warn so authors pick one explicitly.
  if (!deck.themeId && deck.slides[0]) {
    push(deck.slides[0], 0, "deck-no-theme",
      "Deck has no themeId — falling back to default. Set deck.themeId to lock visuals.", "warn");
  }



  // Theme token contrast (WCAG AA): fg/bg must reach 4.5:1 for body text;
  // .hl-pill ink-on-highlight must reach 3:1 (large-text threshold — pills
  // are display-sized). Only checks hex tokens; non-hex (oklch/var) is skipped.
  const themeIds = new Set<string>();
  if (deck.themeId) themeIds.add(deck.themeId);
  for (const s of deck.slides) if (s.themeId) themeIds.add(s.themeId);
  for (const tid of themeIds) {
    const theme = THEMES.find((t) => t.id === tid);
    if (!theme) continue;
    const anchor = deck.slides.find((s) => s.themeId === tid) ?? deck.slides[0];
    if (!anchor) continue;
    const i = deck.slides.indexOf(anchor);
    const fgBg = contrastRatio(theme.fg, theme.bg);
    if (fgBg !== null && fgBg < 4.5) {
      push(anchor, i, "theme-contrast-low",
        `Theme "${theme.id}" fg/bg contrast ${fgBg.toFixed(2)}:1 below WCAG AA 4.5:1.`, "warn");
    }
    const hlInk = contrastRatio(theme.hlInk, theme.hl);
    if (hlInk !== null && hlInk < 3) {
      push(anchor, i, "theme-contrast-low",
        `Theme "${theme.id}" hl-pill ink/hl contrast ${hlInk.toFixed(2)}:1 below 3:1.`, "warn");
    }
  }


  // Collision detection on authored slide.number
  const seen = new Map<number, string>();
  for (let i = 0; i < deck.slides.length; i++) {
    const s = deck.slides[i];
    if (typeof s.number !== "number") continue;
    if (s.number < 0 || !Number.isFinite(s.number)) {
      push(s, i, "slide-number-negative",
        `Slide.number=${s.number} must be a non-negative finite integer.`, "warn");
    }
    const prior = seen.get(s.number);
    if (prior) {
      push(s, i, "number-collision", `Authored number ${s.number} duplicates slide "${prior}"`, "warn");
    } else {
      seen.set(s.number, s.title || s.id);
    }
  }

  // Consecutive slides with the same explicit themeId override are redundant —
  // hoist to deck.themeId or remove the second override.
  for (let i = 1; i < deck.slides.length; i++) {
    const prev = deck.slides[i - 1];
    const cur = deck.slides[i];
    if (cur.themeId && prev.themeId && cur.themeId === prev.themeId) {
      push(cur, i, "theme-consecutive-redundant",
        `Slide themeId "${cur.themeId}" matches the previous slide — set deck.themeId instead.`, "warn");
    }
  }


  // Duplicate slide.id check — IDs are the persistence key, collisions break navigation.
  const idSeen = new Map<string, number>();
  for (let i = 0; i < deck.slides.length; i++) {
    const s = deck.slides[i];
    if (!s.id) continue;
    const prior = idSeen.get(s.id);
    if (prior !== undefined) {
      push(s, i, "duplicate-id", `Slide id "${s.id}" duplicates slide #${prior + 1}`, "error");
    } else {
      idSeen.set(s.id, i);
    }
  }

  // Duplicate title detection — warn (not error), since identical titles are
  // sometimes intentional (e.g. "Demo" / "Demo (cont.)") but usually a copy mistake.
  const titleSeen = new Map<string, number>();
  for (let i = 0; i < deck.slides.length; i++) {
    const s = deck.slides[i];
    const t = s.title?.trim();
    if (!t) continue;
    const prior = titleSeen.get(t);
    if (prior !== undefined) {
      push(s, i, "duplicate-title", `Title "${t}" duplicates slide #${prior + 1} — confusing for navigation.`, "warn");
    } else {
      titleSeen.set(t, i);
    }
  }

  // Slide ids should be URL-safe kebab-case (used in `/slides/$id` deep links
  // by some integrations). Warn on whitespace, uppercase, or punctuation.
  for (let i = 0; i < deck.slides.length; i++) {
    const s = deck.slides[i];
    if (s.id && !/^[a-z0-9][a-z0-9-]*$/.test(s.id)) {
      push(s, i, "slide-id-not-kebab",
        `Slide id "${s.id}" is not kebab-case — prefer [a-z0-9-] for URL safety.`,
        "warn");
    }
  }

  for (let i = 0; i < deck.slides.length; i++) {
    const s = deck.slides[i];
    if (!s.title?.trim()) push(s, i, "title-missing", "Slide has no title", "error");

    if (s.title && s.title.length > 80) {
      push(s, i, "title-too-long",
        `Slide title is ${s.title.length} chars — keep ≤80 so it fits the badge/grid without truncation.`,
        "warn");
    }

    // Per-slide themeId override must resolve.
    if (s.themeId && !THEMES.some((t) => t.id === s.themeId)) {
      push(s, i, "slide-theme-unknown",
        `Slide themeId "${s.themeId}" does not match any built-in theme.`, "warn");
    }



    // Spec rule: lists/quotes/timelines must never zoom.
    if ((s.type === "bullets" || s.type === "quote" || s.type === "timeline")
        && Array.isArray(s.focus) && s.focus.length > 0) {
      push(s, i, "focus-on-list",
        `${s.type} slide has focus regions — lists/quotes/timelines must never zoom (move focus to a companion image slide).`,
        "warn");
    }

    if (typeof s.notes === "string" && s.notes.length > 500) {
      push(s, i, "notes-too-long",
        `Speaker notes are ${s.notes.length} chars (>500) — split into shorter cues for stage reading.`, "warn");
    }

    // Focus region step bound check — `step` must be 1..slideStepCount(slide).
    const steps = slideStepCount(s);
    if (Array.isArray(s.focus)) {
      const stepSeen = new Set<number>();
      for (const r of s.focus) {
        if (typeof r.step === "number") {
          if (stepSeen.has(r.step)) {
            push(s, i, "focus-step-duplicate",
              `Two focus regions target step ${r.step} — only the first will activate.`, "error");
          } else {
            stepSeen.add(r.step);
          }
          if (r.step < 1 || (steps > 0 && r.step > steps)) {
            push(s, i, "focus-step-out-of-range",
              `Focus region targets step ${r.step}, but slide has ${steps || "no"} step${steps === 1 ? "" : "s"}.`,
              "warn");
          }
        }
        if (r.w <= 0 || r.h <= 0 || r.x < 0 || r.y < 0) {
          push(s, i, "focus-rect-invalid",
            `Focus rect has invalid dimensions (x=${r.x}, y=${r.y}, w=${r.w}, h=${r.h}) — w/h must be > 0, x/y >= 0.`,
            "error");
        } else if (r.x + r.w > 1920 || r.y + r.h > 1080) {
          push(s, i, "focus-rect-out-of-bounds",
            `Focus rect extends past the 1920×1080 canvas (ends at ${r.x + r.w},${r.y + r.h}).`,
            "warn");
        }
      }
    }


    // Padding & budget sanity.
    if (typeof s.padding === "number" && (s.padding < 0 || s.padding > 400)) {
      push(s, i, "padding-out-of-range",
        `padding=${s.padding} is outside [0, 400] — text will clip or float oddly.`, "warn");
    }
    if (typeof s.budget === "number" && s.budget <= 0) {
      push(s, i, "budget-invalid",
        `budget=${s.budget}s must be > 0 — pacing badge will divide by zero.`, "warn");
    }
    if (typeof s.budget === "number" && s.budget > 600) {
      push(s, i, "budget-too-long",
        `budget=${s.budget}s (>10 min) is unusually long for a single slide — split or revisit.`, "warn");
    }
    if (typeof s.budget === "number" && s.budget > 0 && !Number.isInteger(s.budget)) {
      push(s, i, "budget-non-integer",
        `budget=${s.budget}s should be a whole-second integer for predictable pacing UI.`, "warn");
    }
    if (s.padding === 0 && typeof s.align === "string"
        && (s.align.startsWith("top-") || s.align.startsWith("bottom-")
            || s.align.endsWith("-left") || s.align.endsWith("-right"))) {
      push(s, i, "padding-zero-edge-align",
        `padding=0 with edge-anchored align "${s.align}" will clip against the canvas edge.`, "warn");
    }
    if (s.id && s.id.length > 64) {
      push(s, i, "slide-id-too-long",
        `Slide id is ${s.id.length} chars — keep ≤64 for URL/export readability.`, "warn");
    }
    if (s.decor === "code" && (s.type === "quote" || s.type === "poll" || s.type === "qa")) {
      push(s, i, "decor-on-non-content",
        `decor:"code" on a ${s.type} slide adds visual noise — reserve for content/timeline/steps slides.`, "warn");
    }
    if (s.type === "image" && s.caption && richLen(s.caption) > 160) {
      push(s, i, "image-caption-too-long",
        `Image caption is ${richLen(s.caption)} chars (>160) — trim or move to a left/text slide.`, "warn");
    }



    // Background URL must be https:// when remote.
    if (typeof s.background === "string" && /^http:\/\//i.test(s.background)) {
      push(s, i, "background-not-https",
        "Slide background uses http:// — mixed-content blocks the image on published https sites.",
        "warn");
    }

    // Per-slide sound cue schema.
    if (s.sound) {
      const { url, volume } = s.sound;
      if (url !== undefined) {
        if (typeof url !== "string" || !url.trim()) {
          push(s, i, "slide-sound-url-invalid", "Slide sound.url must be a non-empty string.", "error");
        } else if (!/^https:\/\//i.test(url) && !url.startsWith("/")) {
          push(s, i, "slide-sound-url-not-https",
            `Slide sound.url "${url}" must be https:// or an absolute path under /public.`, "warn");
        }
      }
      if (typeof volume === "number" && (volume < 0 || volume > 1)) {
        push(s, i, "slide-sound-volume-out-of-range",
          `Slide sound.volume ${volume} is outside [0, 1].`, "warn");
      }
    }




    switch (s.type) {
      case "bullets":
        if (!Array.isArray(s.bullets) || s.bullets.length === 0)
          push(s, i, "bullets-no-bullets", "Bullets slide has no bullets — the body will be blank.", "error");
        if (s.bullets.length > 6) push(s, i, "too-many-bullets", `${s.bullets.length} bullets (max 6 recommended)`);
        if (s.bullets.some((b) => richLen(b) > 90))
          push(s, i, "bullet-too-long", "A bullet exceeds 90 characters — split or trim");
        if (richLen(s.heading) === 0) push(s, i, "heading-empty", "Bullets slide is missing a heading", "error");
        break;

      case "steps": {
        if (!Array.isArray(s.steps) || s.steps.length === 0)
          push(s, i, "steps-no-steps", "Steps slide has no steps — nothing to advance through.", "error");
        if (s.steps.length > 7) push(s, i, "too-many-steps", `${s.steps.length} steps (max 7 recommended)`);
        if (s.steps.some((step) => !step.label?.trim())) push(s, i, "step-label-missing", "A step is missing its label", "error");
        if (s.steps.some((step) => richLen(step.detail) === 0)) push(s, i, "step-detail-missing", "A step is missing detail text", "error");

        const bg = (s as { background?: string }).background;
        const isSvgBg = typeof bg === "string" && (bg.startsWith("data:image/svg") || /\.svg(\?|$)/i.test(bg));
        if (isSvgBg && (!Array.isArray(s.focus) || s.focus.length === 0)) {
          push(s, i, "steps-svg-no-focus",
            "Steps slide uses an SVG background but defines no focus regions — multi-step SVG reveals (spec Pattern A) require per-step focus rectangles.",
            "warn");
        }
        break;
      }
      case "timeline":
        if (!Array.isArray(s.items) || s.items.length === 0)
          push(s, i, "timeline-no-items", "Timeline slide has no items — the rail will be empty.", "error");
        if (s.items.length > 6) push(s, i, "timeline-too-many", `${s.items.length} milestones (max 6 recommended)`);
        if (s.items.some((it) => !it.label?.trim())) push(s, i, "timeline-empty-item", "Timeline item is missing a label", "error");
        if (s.items.every((it) => !it.detail || richLen(it.detail) === 0))
          push(s, i, "timeline-no-detail", "No timeline item has detail text — centre area will be empty");
        if (s.items.some((it) => it.detail && richLen(it.detail) > 120))
          push(s, i, "timeline-item-too-long",
            "A timeline item's detail exceeds 120 characters — trim so the rail stays readable.", "warn");
        break;

      case "center":
        if (richLen(s.heading) === 0) push(s, i, "heading-empty", "Center slide is missing a heading", "error");
        if (richLen(s.heading) > 80) push(s, i, "heading-too-long", "Center heading is very long for a hero slide");
        break;
      case "left":
        if (richLen(s.body) > 320) push(s, i, "body-too-long", "Body copy is dense (>320 chars) — consider splitting");
        if (richLen(s.body) === 0) push(s, i, "body-empty", "Left slide is missing body text", "error");
        if (richLen(s.heading) === 0) push(s, i, "heading-empty", "Left slide is missing a heading", "error");
        if (s.media && typeof s.media === "object" && "src" in s.media && !(s.media as { alt?: string }).alt?.trim()) {
          push(s, i, "left-media-alt-missing", "Left-slide media is missing alt text (a11y).", "warn");
        }
        break;
      case "quote":
        if (richLen(s.quote) > 220) push(s, i, "quote-too-long", "Quote is long — trim for impact");
        if (richLen(s.quote) > 0 && richLen(s.quote) < 20)
          push(s, i, "quote-too-short",
            "Quote is very short (<20 chars) — risks reading as a label, not a quote.", "warn");
        if (!s.attribution) push(s, i, "quote-no-attribution", "Quote has no attribution");
        break;
      case "poll":
        if (!s.question?.trim()) push(s, i, "poll-no-question", "Poll slide is missing its question", "error");
        if (!Array.isArray(s.options) || s.options.length < 2)
          push(s, i, "poll-too-few-options", "Poll needs at least 2 options", "error");
        else if (s.options.length > 6)
          push(s, i, "poll-too-many-options", `Poll has ${s.options.length} options (max 6 recommended)`);
        if (Array.isArray(s.options) && s.options.some((o) => !o?.trim())) {
          push(s, i, "poll-empty-option",
            "Poll has at least one empty/whitespace option — vote tallies will be meaningless.",
            "error");
        }
        if (Array.isArray(s.options)) {
          const normalized = s.options.map((o) => (o ?? "").trim().toLowerCase()).filter(Boolean);
          if (new Set(normalized).size !== normalized.length) {
            push(s, i, "poll-duplicate-option",
              "Poll has duplicate options — votes split unpredictably between identical labels.", "warn");
          }
        }
        break;

      case "qa":
        if (!s.prompt?.trim())
          push(s, i, "qa-no-prompt", "Q&A slide has no prompt — audience won't know what to ask");
        if (i !== deck.slides.length - 1)
          push(s, i, "qa-not-last",
            "Q&A slide isn't the last slide — audience usually expects Q&A at the end.", "warn");
        break;
      case "image": {
        if (!s.src?.trim())
          push(s, i, "image-src-missing", "Image slide has no src — the canvas will be blank.", "error");

        if (!s.alt?.trim()) push(s, i, "image-alt-missing", "Image is missing alt text (a11y)", "error");
        else if (looksLikeFilename(s.alt)) {
          push(s, i, "image-alt-filename",
            `Alt text "${s.alt}" looks like a filename — describe what's in the image instead.`,
            "warn");
        }
        if (s.fit === "split" && richLen(s.heading) === 0) {
          push(s, i, "image-split-no-heading",
            'Image slide with fit: "split" has no heading — the text column will be empty.',
            "warn");
        }
        if (hasMarkdownMarkers(s.caption) || (s.alt && /\*\*|__/.test(s.alt))) {
          push(s, i, "caption-markdown",
            "Caption/alt contains markdown markers (** or __) — use RichText highlights instead.",
            "warn");
        }
        // Inline base64 size budget — spec recommends ≤200 KB binary (~270 KB base64).
        if (s.src.startsWith("data:") && s.src.length > 270_000) {
          const kb = Math.round(s.src.length / 1024);
          push(s, i, "base64-image-large",
            `Inline base64 image is ${kb} KB — spec recommends hosting and using a URL when >200 KB.`,
            "warn");
        }
        break;
      }
      case "embed": {
        if (!s.url?.trim()) {
          push(s, i, "embed-missing-url", "Embed slide has no URL — iframe will be blank.", "error");
        } else if (!/^https:\/\//i.test(s.url)) {
          push(s, i, "embed-not-https",
            `Embed URL must use https:// (got "${s.url.slice(0, 40)}…") — mixed content blocks the iframe on published sites.`,
            "error");
        } else if (!isTrustedEmbedHost(s.url)) {
          push(s, i, "embed-untrusted-host",
            `Embed host "${safeHost(s.url)}" is not in the known-safe list (youtube, vimeo, codesandbox, figma, loom, codepen) — many other hosts block iframing via X-Frame-Options.`,
            "warn");
        }
        break;
      }

    }

    // Consecutive quote slides — pacing smell, audience tunes out.
    if (s.type === "quote" && i > 0 && deck.slides[i - 1].type === "quote") {
      push(s, i, "consecutive-quotes",
        "Two quote slides in a row — break the rhythm with a different slide type.",
        "warn");
    }

    // 3+ consecutive image slides — pacing smell, becomes a slideshow lull.
    if (s.type === "image" && i >= 2
        && deck.slides[i - 1].type === "image"
        && deck.slides[i - 2].type === "image") {
      push(s, i, "consecutive-images",
        "Three image slides in a row — interleave with text or quote slides to keep narrative momentum.",
        "warn");
    }
    // Consecutive embed slides — iframe load stalls + nothing to fall back to.
    if (s.type === "embed" && i > 0 && deck.slides[i - 1].type === "embed") {
      push(s, i, "consecutive-embeds",
        "Two embed slides in a row — iframe load latency compounds; insert a text slide between.",
        "warn");
    }
  }

  // Deck-level: too many embeds total — each iframe is expensive.
  const embedCount = deck.slides.filter((s) => s.type === "embed").length;
  if (embedCount > 3 && deck.slides[0]) {
    push(deck.slides[0], 0, "embed-too-many-deck",
      `Deck has ${embedCount} embed slides — each iframe ships its own runtime. Keep ≤3 for smooth navigation.`,
      "warn");
  }
  return out;
}


function hasMarkdownMarkers(rt?: RichText): boolean {
  if (!rt) return false;
  return rt.some((p) => /\*\*|__/.test(typeof p === "string" ? p : p.text));
}

/** Severity tallies for a lint result — used by panels, CLI, and CI scripts. */
export function countIssues(issues: LintIssue[]): { errors: number; warns: number; total: number } {
  const errors = issues.filter((i) => i.severity === "error").length;
  return { errors, warns: issues.length - errors, total: issues.length };
}

const FILENAME_RE = /\.(png|jpe?g|gif|webp|svg|avif|bmp|tiff?)$/i;
function looksLikeFilename(s: string): boolean {
  const trimmed = s.trim();
  return FILENAME_RE.test(trimmed) || /^[a-z0-9_\-./]+$/i.test(trimmed) && trimmed.includes("/");
}

const TRUSTED_EMBED_HOSTS = [
  "youtube.com", "youtu.be", "youtube-nocookie.com",
  "vimeo.com", "player.vimeo.com",
  "codesandbox.io", "codepen.io",
  "figma.com",
  "loom.com",
];
function safeHost(url: string): string {
  try { return new URL(url).hostname; } catch { return url.slice(0, 40); }
}
function isTrustedEmbedHost(url: string): boolean {
  const host = safeHost(url).toLowerCase();
  return TRUSTED_EMBED_HOSTS.some((h) => host === h || host.endsWith("." + h));
}


/** Documented list of every rule the linter can emit. Kept in sync by hand
 *  with the rules above so the LLM guideline / docs can reference it. */
export const LINT_RULES: ReadonlyArray<{ id: string; severity: LintSeverity; summary: string }> = [
  { id: "theme-contrast-low", severity: "warn", summary: "Theme fg/bg (<4.5:1) or hl-pill ink/hl (<3:1) below WCAG threshold." },
  { id: "number-collision", severity: "warn", summary: "Two slides share an authored slide.number." },
  { id: "duplicate-id", severity: "error", summary: "Two slides share the same id." },
  { id: "title-missing", severity: "error", summary: "Slide has no title." },
  { id: "focus-on-list", severity: "warn", summary: "bullets / quote / timeline must not zoom." },
  { id: "focus-step-out-of-range", severity: "warn", summary: "Focus region targets a non-existent step." },
  { id: "too-many-bullets", severity: "warn", summary: ">6 bullets on one slide." },
  { id: "bullet-too-long", severity: "warn", summary: "A bullet exceeds 90 chars." },
  { id: "heading-empty", severity: "error", summary: "bullets / center / left slide missing heading." },
  { id: "too-many-steps", severity: "warn", summary: ">7 steps on one slide." },
  { id: "step-label-missing", severity: "error", summary: "A step has no label." },
  { id: "step-detail-missing", severity: "error", summary: "A step has no detail text." },
  { id: "steps-svg-no-focus", severity: "warn", summary: "Steps slide with SVG bg but no focus regions." },
  { id: "timeline-too-many", severity: "warn", summary: ">6 timeline milestones." },
  { id: "timeline-empty-item", severity: "error", summary: "Timeline item missing label." },
  { id: "timeline-no-detail", severity: "warn", summary: "No timeline item has detail text." },
  { id: "heading-too-long", severity: "warn", summary: "Center heading >80 chars." },
  { id: "body-empty", severity: "error", summary: "Left slide missing body text." },
  { id: "body-too-long", severity: "warn", summary: "Body copy >320 chars." },
  { id: "quote-too-long", severity: "warn", summary: "Quote >220 chars." },
  { id: "quote-no-attribution", severity: "warn", summary: "Quote has no attribution." },
  { id: "poll-no-question", severity: "error", summary: "Poll missing question." },
  { id: "poll-too-few-options", severity: "error", summary: "Poll has <2 options." },
  { id: "poll-too-many-options", severity: "warn", summary: "Poll has >6 options." },
  { id: "qa-no-prompt", severity: "warn", summary: "Q&A slide missing prompt." },
  { id: "image-alt-missing", severity: "error", summary: "Image missing alt text." },
  { id: "image-alt-filename", severity: "warn", summary: "Image alt text looks like a filename." },
  { id: "image-split-no-heading", severity: "warn", summary: 'fit:"split" image slide missing heading.' },
  { id: "caption-markdown", severity: "warn", summary: "Caption/alt has ** or __ markers (use RichText)." },
  { id: "base64-image-large", severity: "warn", summary: "Inline base64 image >200 KB." },
  { id: "embed-not-https", severity: "error", summary: "Embed URL not https://." },
  { id: "consecutive-quotes", severity: "warn", summary: "Two quote slides back-to-back." },
  { id: "consecutive-images", severity: "warn", summary: "Three image slides back-to-back." },
  { id: "consecutive-embeds", severity: "warn", summary: "Two embed slides back-to-back." },
  { id: "embed-too-many-deck", severity: "warn", summary: "More than 3 embed slides in the deck." },
  { id: "volume-out-of-range", severity: "warn", summary: "Deck volume outside [0, 1]." },
  { id: "duplicate-title", severity: "warn", summary: "Two slides share the same title." },
  { id: "focus-rect-invalid", severity: "error", summary: "Focus rect has w<=0, h<=0, or negative x/y." },
  { id: "focus-rect-out-of-bounds", severity: "warn", summary: "Focus rect extends past 1920×1080." },
  { id: "padding-out-of-range", severity: "warn", summary: "Slide padding outside [0, 400]." },
  { id: "budget-invalid", severity: "warn", summary: "Slide budget <= 0." },
  { id: "budget-too-long", severity: "warn", summary: "Slide budget > 600s (10 min)." },
  { id: "deck-title-untitled", severity: "warn", summary: "Deck title is empty or 'Untitled'." },
  { id: "empty-deck", severity: "error", summary: "Deck has zero slides." },
  { id: "deck-too-long", severity: "warn", summary: "Deck has >60 slides." },
  { id: "multiple-qa-slides", severity: "warn", summary: "Deck has more than one Q&A slide." },
  { id: "slide-id-not-kebab", severity: "warn", summary: "Slide id is not URL-safe kebab-case." },
  { id: "background-not-https", severity: "warn", summary: "Slide background URL uses http://." },
  { id: "embed-missing-url", severity: "error", summary: "Embed slide has no URL." },
  { id: "left-media-alt-missing", severity: "warn", summary: "Left-slide media missing alt text." },
  { id: "music-url-not-https", severity: "warn", summary: "Deck music URL must be https:// or absolute path." },
  { id: "music-volume-out-of-range", severity: "warn", summary: "Deck music volume outside [0, 1]." },
  { id: "slide-sound-url-invalid", severity: "error", summary: "Per-slide sound.url is empty or not a string." },
  { id: "slide-sound-url-not-https", severity: "warn", summary: "Per-slide sound.url must be https:// or absolute path." },
  { id: "slide-sound-volume-out-of-range", severity: "warn", summary: "Per-slide sound.volume outside [0, 1]." },
  { id: "deck-runtime-too-long", severity: "warn", summary: "Sum of slide budgets exceeds 60 min." },
  { id: "quote-first-slide", severity: "warn", summary: "First slide is a quote — weak opener." },
  { id: "deck-theme-unknown", severity: "warn", summary: "Deck themeId does not match any built-in theme." },
  { id: "slide-theme-unknown", severity: "warn", summary: "Slide themeId does not match any built-in theme." },
  { id: "quote-too-short", severity: "warn", summary: "Quote shorter than 20 characters." },
  { id: "poll-empty-option", severity: "error", summary: "Poll has an empty/whitespace option." },
  { id: "embed-untrusted-host", severity: "warn", summary: "Embed URL host is not in the known-safe iframe list." },
  { id: "deck-no-theme", severity: "warn", summary: "Deck has no themeId — falls back to default theme." },
  { id: "title-too-long", severity: "warn", summary: "Slide title >80 chars (truncates in badge/grid)." },
  { id: "budget-too-short", severity: "warn", summary: "Slide budget <5s (badge flashes by)." },
  { id: "bullets-no-bullets", severity: "error", summary: "Bullets slide has empty bullets array." },
  { id: "steps-no-steps", severity: "error", summary: "Steps slide has empty steps array." },
  { id: "timeline-no-items", severity: "error", summary: "Timeline slide has empty items array." },
  { id: "timeline-item-too-long", severity: "warn", summary: "A timeline item detail >120 chars." },
  { id: "poll-duplicate-option", severity: "warn", summary: "Poll has duplicate option labels." },
  { id: "qa-not-last", severity: "warn", summary: "Q&A slide isn't the last slide in the deck." },
  { id: "image-src-missing", severity: "error", summary: "Image slide has empty src." },
  { id: "darken-out-of-range", severity: "warn", summary: "Deck darken outside [0, 1]." },
  { id: "blur-out-of-range", severity: "warn", summary: "Deck blur outside [0, 1]." },
  { id: "backgroundColor-not-hex", severity: "warn", summary: "Deck backgroundColor isn't a hex value." },
  { id: "slide-number-negative", severity: "warn", summary: "Authored slide.number is negative or non-finite." },
  { id: "theme-consecutive-redundant", severity: "warn", summary: "Adjacent slides share the same themeId override." },
  { id: "notes-too-long", severity: "warn", summary: "Speaker notes exceed 500 chars." },
  { id: "focus-step-duplicate", severity: "error", summary: "Two focus regions target the same step." },
];

/** Sum of all positive slide budgets, in seconds. */
export function deckRuntimeSeconds(deck: Deck): number {
  return deck.slides.reduce(
    (n, s) => n + (typeof s.budget === "number" && s.budget > 0 ? s.budget : 0),
    0,
  );
}



/** Pure deck stats — counts by slide type plus totals. Used by overview UIs and analytics. */
export function deckStats(deck: Deck): {
  total: number;
  byType: Record<string, number>;
  withFocus: number;
  withBackground: number;
} {
  const byType: Record<string, number> = {};
  let withFocus = 0;
  let withBackground = 0;
  for (const s of deck.slides) {
    byType[s.type] = (byType[s.type] ?? 0) + 1;
    if (Array.isArray(s.focus) && s.focus.length > 0) withFocus++;
    if (typeof s.background === "string" && s.background.length > 0) withBackground++;
  }
  return { total: deck.slides.length, byType, withFocus, withBackground };
}
