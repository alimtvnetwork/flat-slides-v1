# Subtask 02 — IA decision: routes after slides-first

**Parent:** 01-slides-first-preview
**Slug:** ia-decision
**Status:** pending
**Created:** 2026-06-06

## Decision

- `/` → SlidesHomeShell (deck slide 1 + launcher + controller pill).
- `/about` → marketing content currently at `/` (moved verbatim, then
  trimmed in a later plan).
- `/slides` → continues to serve as the deep-link surface
  (`slides.index.tsx` redirects to `/slides/1`).
- `/slides/$slideId(/$step)` → unchanged.
- `/slides/inspector/...`, `/slides/handout`, `/slides/handout-3up`,
  `/slides/print`, `/audience/$sessionId` → unchanged.

## Open questions

- Does `/about` need its own head() og:image? (Default: no — leaf only,
  only if a hero image exists.)
- Do we keep `PresenterFallbackLink` on `/` or move it under the
  launcher? (Default: under the launcher as the Present button's
  fallback path.)

Resolve in Step 8 of the parent plan; record the answer in this file
before implementation begins.
