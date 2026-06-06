# RCA 03 — Root `/` shipped as marketing instead of slides

**Created:** 2026-06-06
**Related issue:** `.lovable/issues/01-root-not-slides-first.md`
**Related command:** `.lovable/spec/commands/01-slides-first-preview.md`

## Root cause (one sentence)

`src/routes/index.tsx` renders a hand-coded marketing landing component (`function Index()`, lines 41–148) that calls `enterFullscreen` and links to `/slides`, instead of redirecting to or mounting the deck — so the preview's first view is product copy, not the deck.

## Timeline

- Initial scaffold shipped a Lovable marketing index.
- v1.0–v1.6 added Present / Open / JSON-spec buttons but kept the marketing layout as the root surface.
- No spec citation ever justified marketing-first; the controller-2026 and 27-slides-number specs assume the deck IS the surface.

## Faulty assumptions (REJECTED by the slides-first command)

1. "Homepage needs to sell the product before showing the deck." — Rejected.
2. "Lovable previews look better with a hero." — Rejected.
3. "`/slides` is enough as the deck entry." — Rejected; the user opens `/`.

## Implicated files (exact)

- `src/routes/index.tsx` lines 22–149 (entire `Index` component + `Feature` helper).
- `src/routes/slides.index.tsx` (deck overview — currently the only deck-first surface).
- `src/routes/slides.tsx` lines 19–30 (`SlidesFullscreenRoot`).
- `src/components/slides/home-present.ts` (`HOME_PRESENT_SLIDE_ID`, `getHomePresentUrl`, `openHomePresenterWindow`, `shouldNavigateHomeAfterPresent`).
- `src/components/slides/controls/PresenterFallbackLink.tsx`.

## Corrected IA

- `/` → redirects to `/slides/1` (deck slide 1) via `beforeLoad`. Slides ARE the first view.
- `/about` → new route; receives the legacy marketing JSX verbatim for users who want product copy.
- `/slides`, `/slides/$slideId(/$step)`, `/slides/inspector/...`, `/slides/handout(-3up)`, `/slides/print`, `/audience/$sessionId` — unchanged.
- Launcher (Present / Inspector / Handout / Print / Audience / Import / Export / Settings) lands in a follow-up plan and mounts inside `SlidesFullscreenRoot`, not in `index.tsx`.

## Guardrail

Add to `mem://index.md` Core: `Root '/' redirects to '/slides/1'. Marketing lives at '/about'. Never reintroduce a marketing landing at '/'.`

## References

- Command: `.lovable/spec/commands/01-slides-first-preview.md`
- Plan: `.lovable/plans/pending/01-slides-first-preview.md`
- Issue: `.lovable/issues/01-root-not-slides-first.md`
