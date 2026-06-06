# Issue: Root route `/` shows a marketing/landing page instead of slides

**Slug:** root-not-slides-first
**Status:** open
**Created:** 2026-06-06
**Severity:** high — violates the slides-first command

## Symptom

Visiting `/` (the preview's default route) shows a landing page with
hero copy, feature cards, and links into the slides app. The actual
deck and the "Present / Inspector / Handout / Print" launcher are not
the first thing the user sees.

## Repro

1. Open the preview at `/`.
2. Observe: marketing layout from `src/routes/index.tsx` renders first.
3. Expected: the slides canvas + a launcher row of buttons for each
   documented case (Present, Inspector, Handout, Handout-3up, Print,
   Audience) is what loads first. Any marketing content moves to a
   dedicated `/about` route.

## Related files

- `src/routes/index.tsx` (current landing)
- `src/routes/slides.index.tsx` (current slides entry)
- `src/routes/slides.tsx` (slides layout)
- `src/components/slides/` (canvas, controller, settings)
- `spec/old-slides/27-slides-number/` (surface contracts: top-bar, badge,
  dot-pagination, controller indicator, jumper)
- `spec/old-slides/controller-2026/` (controller spec)

## Expected behavior

- `/` renders the deck (slide 1) with controller pill, settings entry,
  and a launcher panel exposing every documented case as a button.
- Buttons map to: Present (fullscreen), Inspector
  (`/slides/inspector/1`), Handout (`/slides/handout`), Handout-3up
  (`/slides/handout-3up`), Print (`/slides/print`), Audience link.
- Marketing/landing content (if retained) moves to `/about` or
  `/landing`.

## Notes

Companion plan: `.lovable/plans/pending/01-slides-first-preview.md`.
Root-cause analysis: `.lovable/memory/diagnostics/03-root-not-slides-first-rca.md`.
