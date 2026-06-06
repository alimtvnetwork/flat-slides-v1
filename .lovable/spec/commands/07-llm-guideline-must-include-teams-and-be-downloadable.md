# Command 07 — LLM JSON guideline must include team info and be downloadable

**Status:** active
**Created:** 2026-06-06

## Command verbatim
> Put the teams information in the LLM guideline, which I can download and
> share with other AI models … update the LLM MD file so that any LLM or AI
> reads that and could create fantastic slides just by creating the JSONs.

## Scope
The canonical LLM-facing guide is `docs/slides/spec/llm-json-guideline.md`
(also mirrored to `public/docs/llm-json-guideline.md` so it is served at
`/docs/llm-json-guideline.md` for download).

## Requirements
1. Every slide type (existing + the new ones added in plan 06) is documented
   with: purpose, JSON shape, required/optional fields, example, do/don't.
2. A **Teams** section describing the team/profile slide JSON shape,
   including roles, avatars (URL or base64), social links, ordering.
3. A **Themes** section listing every available theme id + accent colors.
4. A **Slide-number controller** section explaining ellipsis pagination and
   the configurable threshold.
5. A "Download this guide" link in the in-app launcher pointing to
   `/docs/llm-json-guideline.md`.

## Files
- `docs/slides/spec/llm-json-guideline.md`
- `public/docs/llm-json-guideline.md` (mirror, auto-copied)
- `docs/slides/spec/sample-deck.json` + `public/docs/sample-deck.json`
- `src/components/slides/controls/DeckLauncher.tsx` (download link)
