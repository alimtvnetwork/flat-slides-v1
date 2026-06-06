# Command: Slides are the first thing visible in the preview

**Slug:** slides-first-preview
**Status:** active
**Created:** 2026-06-06
**Scope:** Root route `/` and any default-landing surface in the project.

## Verbatim

> "For the preview, add the slides as the first preview. You don't have to
> showcase the website and then do slides. Slides would be the first thing
> that we should be seeing, and it should have the slides button, uh, for
> each cases, which should be described in the spec folder."

## Rule

- The root route `/` MUST render the slides surface directly (the deck /
  presenter canvas), NOT a marketing landing page that links to slides.
- A visible "Slides" launcher / case selector MUST be present, with one
  button per documented case (Present, Inspector, Handout, Print,
  Handout-3up, etc.) as enumerated in the spec folders.
- Marketing copy and feature lists can live on a separate route
  (e.g. `/about` or `/landing`), never on `/`.

## When it applies

Every time the app shell, root route, or default landing surface is touched.
Future redesigns of `/` MUST keep slides first.

## Source spec folders to honor

- `spec/old-slides/21-slides-system/`
- `spec/old-slides/22-slides-issues/`
- `spec/old-slides/27-slides-number/`
- `spec/old-slides/controller-2026/` (controller + settings authority)
- `spec/old-slides/camera-2026/`
