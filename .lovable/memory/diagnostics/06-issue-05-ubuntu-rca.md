# Diagnostic — Issue 05 RCA (Plan 06 Phase A Step 2)

**Date:** 2026-06-06
**Issue:** `.lovable/issues/05-first-slide-not-ubuntu.md`
**Status:** RCA confirmed (CSS, not HTML; not font-loading)

## Root cause (one sentence)

In `src/styles.css`, `.slide-title` (line 248), `.slide-subtitle` (line 249),
and `.slide-kicker` (line 253) declare `font-weight` and `font-size` but NOT
`font-family`, so they inherit `font-family: var(--slide-font-body)` (Poppins)
from `.slide-content` (line 223) — only `.slide-title-lg` (line 247) and the
generic `.slide-heading` (line 244) actually set `var(--slide-font-heading)`
(Ubuntu).

## Evidence

- `src/styles.css:185-187` — `--slide-font-heading` and `--slide-font-display`
  both resolve to `"Ubuntu", system-ui, sans-serif`.
- `src/styles.css:218-241` — `.slide-content` sets
  `font-family: var(--slide-font-body)` (Poppins) as the inherited default
  for every descendant.
- `src/styles.css:243-253` — only `.slide-display`, `.slide-heading`,
  `.slide-title-lg` set `font-family`. `.slide-title`, `.slide-subtitle`,
  `.slide-kicker` do not.
- Slide 1 (and most slides) use `.slide-title` (128px) — so its computed
  `font-family` is Poppins, contradicting the "Ubuntu for any headers" rule
  in `.lovable/spec/commands/05-default-header-font-ubuntu.md`.
- `src/components/slides/types/` does NOT exist; slide rendering is
  centralized in `src/components/slides/RenderSlide.tsx`. The Plan 06
  Context reference to `src/components/slides/types/*` is stale — the bug
  is in shared CSS, not per-type rendering.

## Font `<link>` audit (Step 3)

`src/routes/__root.tsx:101` loads:
`https://fonts.googleapis.com/css2?family=Ubuntu:wght@400;500;700&family=Poppins:wght@400;600;700;900&display=block`

- Ubuntu weights present: `400, 500, 700` — sufficient for `font-weight: 700`
  used by `.slide-title-lg`. **No font-loading gap for the bold-title use case.**
- Italics NOT loaded. If any forthcoming spec requires italic headings
  (`400i;700i`), the `<link>` href must be extended; otherwise leave as-is.

## Minimum correct fix (for Phase B Step 21)

Add `font-family: var(--slide-font-heading);` to `.slide-title`,
`.slide-subtitle`, and `.slide-kicker` in `src/styles.css:248-253`. One
declaration per rule. Do not touch `RenderSlide.tsx` — the markup is correct;
the CSS is the regression.

## Open follow-ups for Phase A Step 4 (typography addendum)

1. Codify: every `.slide-*` heading rule MUST set
   `font-family: var(--slide-font-heading)` explicitly — no inheritance.
2. Add a vitest like `hl-pill-no-glow.test.ts` that parses `src/styles.css`
   and asserts every `.slide-title*` / `.slide-subtitle` / `.slide-kicker`
   rule declares `font-family: var(--slide-font-heading)`. Prevents
   silent regression.
3. Note the stale path: Plan 06 Context references
   `src/components/slides/types/*` (does not exist). Update Context when
   touching plan 06 next.
