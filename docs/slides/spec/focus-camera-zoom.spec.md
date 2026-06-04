# Focus camera zoom

## Problem

Focus-region zoom was authored into slide data (`slide.focus`) and routes pass a
1-based step into `CameraStage`, but `CameraStage` currently renders an identity
wrapper. The result is that explicit focus/zoom regions never animate.

## Root cause

- `src/components/slides/CameraStage.tsx` ignores `slide` and `step`.
- `getActiveFocusRegion(slide, step)` exists and resolves the correct 1-based
  focus rectangle, but no runtime component consumes it.
- `SlideTransition` is correctly fade-only; the bug is not there. Re-enabling
  deck-level camera zoom would regress the previous fullscreen/stacked-transform
  issue.

## Required behavior

1. Default slide-to-slide transition remains `fade`.
2. `CameraStage` applies zoom only when the active slide has a matching
   `focus` rectangle for the current 1-based step.
3. Focus zoom frames the rectangle inside the 1920×1080 canvas with safe margin.
4. Step-bound regions use `FocusRegion.step` as 1-based.
5. The camera layer must clip inside `.slide-wrapper` and never resize the
   fullscreen shell.
6. `CameraStage` must call `useReducedMotion()` and disable transform animation
   when the OS requests reduced motion.

## Acceptance

- A slide with `focus: [{ step: 2, x, y, w, h }]` zooms on `/slides/N/2`.
- The same slide does not zoom on `/slides/N/1` unless an unbound region exists.
- Imported decks with `settings.transition: "camera-zoom"` remain rejected.
- `SlideTransition` remains fade-only.