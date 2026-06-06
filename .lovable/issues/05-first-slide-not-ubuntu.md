# Issue 05 — First slide headers do not render in Ubuntu

**Status:** open
**Created:** 2026-06-06

## Symptom
The first slide's title is not rendered in Ubuntu, contradicting the standing
rule that every header must default to Ubuntu. See reference images in
`assets/samples/01-sample.webp`, `02-sample.webp`, `03-sample.jpg`.

## Repro
1. Load `/slides/1` in preview.
2. Inspect the title element → Computed `font-family` does not begin with `Ubuntu`.

## Expected vs actual
- Expected: `font-family: Ubuntu, …` on every heading on every slide.
- Actual: First slide title falls back to system/Inter.

## Related files (likely)
- `src/components/slides/RenderSlide.tsx` (title element)
- `src/components/slides/types/*` (per-type title rendering, esp. the title/hero slide)
- `src/styles.css` (`--font-display`, `.slide-title*`)
- `src/routes/__root.tsx` (font `<link>`)

## Notes
User shared three reference images under `assets/samples/`. Treat as canonical
visual reference for Ubuntu weight + tracking on title slides.
