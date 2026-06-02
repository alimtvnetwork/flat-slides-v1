# RCA: Slide Settings, Fullscreen Zoom, Camera, and Proposal Example

## User-reported symptoms
- Settings background color / dark background / black background does not reliably affect the visible slide.
- Settings `darken` and `blur` controls appear to do nothing.
- Slide-to-slide movement with fullscreen and zoom-in/zoom-out can break the fullscreen frame / appear to escape the slide section.
- Camera/focus behavior is not matching the authored spec; colors/darken are not visible as expected.
- The proposal example needs an additional image-on-right / camera-friendly example, not only a text-only proposal slide.

## Root causes found from code inspection

### 1. Background settings are split across unrelated mechanisms
- `SettingsDrawer` writes `settings.backgroundMode`, `settings.backgroundColor`, `settings.darken`, and `settings.blur` into the deck store.
- `ThemeWrap` only maps `settings.backgroundColor` to `--slide-bg`, and only when `backgroundMode === "color"` and the slide has no per-slide `background`.
- `SlideLayout` still lets `slide.background` override the canvas directly, so deck-level settings are invisible on slides with per-slide backgrounds.
- There is no single computed background layer that owns deck theme, deck settings, per-slide background, image mode, darken overlay, and blur.

### 2. `darken`, `blur`, and `backgroundImage` are schema/store fields but not rendered
- `DeckSettings` and the JSON schema define `backgroundImage`, `darken`, and `blur`.
- Settings UI exposes `darken` and `blur` sliders.
- No render path consumes `settings.darken` or `settings.blur`.
- Settings UI does not provide a usable `backgroundImage` input even though `backgroundMode: "image"` exists.
- Result: the user can move controls, but the slide canvas never changes.

### 3. Fullscreen break is caused by nested scale/3D transforms competing
- `ScaledSlide` scales the entire 1920×1080 slide with `transform: scale(var(--scale))` on `.slide-wrapper`.
- `SlideTransition` then applies another animated transform to an absolute child (`scale`, `z`, `rotateX`, blur).
- `CameraStage` can apply a third transform for focus-region zoom.
- In fullscreen this means: fixed fullscreen shell → scaled slide wrapper → transition transform → camera transform → slide content.
- The previous overflow-hidden on `SlideTransition` clips only that wrapper, but it does not solve geometry changes from layered transforms, AnimatePresence exit/enter states, and 3D perspective during fullscreen navigation.
- The `camera-zoom` transition also scales exiting slides to `1.18` and entering slides from `0.78` with z/rotate/filter, which can visually leave the intended frame when combined with parent scale and fullscreen controls.

### 4. Transition zoom and focus camera are two different systems but are currently layered
- `SlideTransition` has a deck-level `camera-zoom` transition for changing slides.
- `CameraStage` has per-slide focus-region zoom for focusing parts of a slide.
- Routes wrap every slide with both components. Even though `allowZoom` is limited, the systems can still stack on display/hero slides and during fullscreen.
- Spec guidance says use `fade` by default and use camera/focus regions for intentional zoom moments; layering both causes unstable motion and confusing behavior.

### 5. Step route has a likely off-by-one camera focus bug
- `getActiveFocusRegion(slide, step)` expects a 1-based `step` value according to `types.ts` comments.
- `slides.$slideId.$step.tsx` passes `stepNum`, which is zero-based.
- `slides.$slideId.index.tsx` passes `step={1}` to `CameraStage` but `RenderSlide` receives `step={0}`.
- Result: focus regions for step 1/2/etc. can target the wrong step or fail to activate, making the camera feel unimplemented or inconsistent.

### 6. Proposal example is text-only and has no right-side image/focus demonstration
- `store.ts` seed slide `sajida` is a `left` slide with no `media` field.
- Existing `LeftSlide` supports `media` on the right side, but the sample data does not use it.
- No seed/sample proposal slide demonstrates right-side image layout or focus regions, so the camera spec is not visibly proven in the example deck.

## Constraints for the fix
- Do not make `camera-zoom` the deck default.
- Do not layer full-slide transition zoom with per-step camera focus on the same navigation path.
- Any animated slide surface must keep using `useReducedMotion()`.
- Settings must be rendered from one source of truth so controls visibly affect the slide canvas.
- Persist this RCA and task list before implementation so future sessions do not repeat the same partial fix.
