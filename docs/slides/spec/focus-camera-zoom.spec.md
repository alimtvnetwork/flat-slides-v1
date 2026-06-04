# Focus camera zoom

## Problem

Focus-region zoom was authored into slide data (`slide.focus`) and routes pass a
1-based step into `CameraStage`, but `CameraStage` currently renders an identity
wrapper. The result is that explicit focus/zoom regions never animate.

There is a second blocked path: authored deck transition
`settings.transition: "camera-zoom"` is rejected by the schema, rewritten by the
store, hidden from Settings, and ignored by `SlideTransition`. That makes any
explicit full-slide zoom request fail before it can render.

## Root cause

- `src/components/slides/CameraStage.tsx` ignores `slide` and `step`.
- `getActiveFocusRegion(slide, step)` exists and resolves the correct 1-based
  focus rectangle, but no runtime component consumes it.
- `SlideTransition` is fade-only and ignores deck settings.
- `TransitionKind`, `DeckSettingsSchema`, `forceFadeTransition`, and Settings
  allow only `"fade"`, so `"camera-zoom"` cannot survive import or UI changes.

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
7. `settings.transition: "camera-zoom"` is valid as an explicit opt-in.
8. Full-slide `camera-zoom` is allowed only when the entering slide has no focus
   regions and is not a `steps` or `timeline` slide. Otherwise it resolves to
   fade to avoid stacked zoom and list/timeline motion.
9. Reduced motion resolves all full-slide transitions to a short opacity fade.

## Acceptance

- A slide with `focus: [{ step: 2, x, y, w, h }]` zooms on `/slides/N/2`.
- The same slide does not zoom on `/slides/N/1` unless an unbound region exists.
- Imported decks with `settings.transition: "camera-zoom"` parse successfully.
- Unknown legacy transitions such as `"morph"` still normalize to `"fade"`.
- `SlideTransition` renders camera zoom only when explicitly requested and safe;
  steps/timeline/focus slides still fade.