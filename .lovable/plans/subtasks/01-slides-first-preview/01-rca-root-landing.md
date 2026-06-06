# Subtask 01 — RCA: why `/` shipped as marketing instead of slides

**Parent:** 01-slides-first-preview
**Slug:** rca-root-landing
**Status:** pending
**Created:** 2026-06-06

## Goal

Produce `.lovable/memory/diagnostics/03-root-not-slides-first-rca.md`
covering:

1. Timeline — when `src/routes/index.tsx` became a marketing landing,
   which prior plan/turn introduced it, and why slides were demoted to
   `/slides`.
2. Faulty assumptions — list each (e.g. "the homepage needs to sell the
   product before showing the deck", "Lovable previews look better with
   a marketing hero"). Mark each as REJECTED by the slides-first
   command.
3. Implicated files — `src/routes/index.tsx`, `src/routes/slides.tsx`,
   `src/routes/slides.index.tsx`, `src/components/slides/home-present.ts`,
   `src/components/slides/controls/PresenterFallbackLink.tsx`.
4. Corrected IA — `/` = slides shell; `/about` (new) = marketing.
5. Guardrail — Core memory line + memory file that future agents will
   read before touching `/`.

## Deliverable shape

A markdown file with sections: Timeline, Faulty assumptions, Files,
Corrected IA, Guardrail, References (linking back to the captured
command + issue).
