# Command 08 — Use `assets/samples/*` as canonical theme/color references

**Status:** active
**Created:** 2026-06-06

## Command verbatim
> I will give you some images. So based on those images, you will try to
> have different color themes … put those images in the assets and reference
> files.

## Scope
Visual + color-theme design decisions for new slide types and new themes
introduced by plan 06.

## Rule
- Reference images live under `assets/samples/`.
- New themes added under `src/slides/themes.ts` MUST cite which sample image
  inspired their palette (comment in the theme definition).
- Any new slide type that ships with a "designed" preset look should match
  the typography/spacing rhythm visible in the samples (Ubuntu Bold titles,
  generous whitespace, single dominant accent).

## Files
- `assets/samples/01-sample.webp`, `02-sample.webp`, `03-sample.jpg`
- `src/slides/themes.ts` (or equivalent theme registry)
