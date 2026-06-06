# SS-04 — LLM JSON guideline rewrite

**Parent:** 06-slide-types-themes-llm-controller
**Slug:** llm-guideline-rewrite
**Status:** pending
**Created:** 2026-06-06

Implements command 07.

## Target files
- `docs/slides/spec/llm-json-guideline.md` (source of truth)
- `public/docs/llm-json-guideline.md` (auto-mirrored for download)
- `docs/slides/spec/sample-deck.json` + `public/docs/sample-deck.json`
- `docs/slides/spec/theme-json-guideline.md` (+ mirror)

## Required sections (in order)
1. **Overview** — what a deck JSON is, top-level shape, schema location.
2. **Authoring rules** — Ubuntu Bold headers, ≤6 words per chunk, no
   hard-coded hex, variety guard between transitions.
3. **Slide types catalog** — every type from SS-01, each with:
   - `purpose`
   - JSON shape (TypeScript-style)
   - Required vs optional fields
   - Minimum working example
   - Do/don't bullets
4. **Media handling** — `url` vs `base64` vs `inlineSvg`, GIF / video /
   Lottie loading, image size limits.
5. **Teams** — TeamRoster + TeamSpotlight JSON shapes, social link enum,
   avatar URL/base64 rules.
6. **Themes** — every theme id from SS-02, accent + mood, when to use.
7. **Controller behaviour** — ellipsis threshold (command 06), what the
   author can configure in `deck.controller`.
8. **Transitions & textAnimation** — enum + variety guard rule.
9. **Validation** — running `bun run lint-deck`, common errors.
10. **Full sample deck** — link to `sample-deck.json` (covering at least
    one instance of each new slide type).
11. **Download** — link to `/docs/llm-json-guideline.md` and
    `/docs/sample-deck.json`.

## In-app download
`DeckLauncher.tsx`: add a "Download LLM guide" link pointing to
`/docs/llm-json-guideline.md` (and the sample deck) so the user can share
it with other AI models in one click.
