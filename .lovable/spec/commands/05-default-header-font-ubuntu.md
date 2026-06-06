# Command 05 — Default header font is Ubuntu (all slides)

**Status:** active
**Created:** 2026-06-06

## Command verbatim
> I ask you to have the default font to be Ubuntu for any headers.

## Scope
Every slide type, every header level (title, subtitle, eyebrow, step titles).
Applies to live presenter, fullscreen, inspector, handout, print, and PDF
export. No per-slide override may swap Ubuntu out unless the user explicitly
asks for that slide.

## When it applies
- Authoring any new slide type.
- Editing `RenderSlide.tsx`, `src/styles.css`, theme files, or any title element.
- Reviewing/QA: inspect computed `font-family` — must start with `Ubuntu`.

## Reference
`assets/samples/01-sample.webp`, `02-sample.webp`, `03-sample.jpg`.
