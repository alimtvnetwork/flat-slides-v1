# Issue: Slide text shadow missing and shortcuts still broken

**Status:** open
**Created:** 2026-06-06

## Symptom

The user reports that slide text shadows still have not been applied as previously specified, and presenter shortcuts are still not working reliably.

## Repro

1. Open the slides-first preview at `/` or `/slides/1`.
2. Inspect slide text/highlight rendering for the required crisp text shadow.
3. Press the expected presenter shortcuts, especially `I` for camera and `F` for presentation/fullscreen.

## Expected

- Slide highlight/text styling uses the specified crisp shadow, especially `text-shadow: rgb(0 0 0) 1px 0.7px 0px;` for `.hl`.
- Presenter shortcuts respond without requiring extra clicks or focus tricks.

## Actual

- The user does not see the requested text shadow effect on slides.
- The user reports shortcuts are still not working.

## Related files if known

- `src/styles.css`
- `src/components/slides/shortcuts.ts`
- `src/components/slides/presenterActions.ts`
- `src/components/slides/SlidePresenterPage.tsx`
- `src/components/slides/PresenterShell.tsx`
- `.lovable/memory/decisions/02-highlight-text-shadow.md`
- `.lovable/memory/specs/02-text-shadow-highlight.md`