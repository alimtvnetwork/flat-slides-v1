# pending-issues index

## Active: Slide settings / fullscreen / camera repair

### Fullscreen / Present (spec: `docs/slides/spec/present-fullscreen.spec.md`)

- [x] Surface fullscreen failures via toast instead of silent catch.
- [x] Detect embedded-preview (iframe) via `window.self !== window.top`.
- [x] Fall back to opening a top-level presenter window when embedded.
- [x] Unit + e2e regression coverage (`fullscreenTarget.test.ts`, `presenterWindowUrl.test.ts`, `e2e/fullscreen-present.spec.ts`).
- [x] Presenter window receives `?present=1` and shows a single-tap "Start presentation" overlay that satisfies the gesture requirement, then strips the param.
- [x] Popup-blocked fallback now shows a persistent "Open presenter window" link plus copy/dismiss controls.
- [x] Presenter shell/stage containment moved into shared components with viewport clipping regression tests.
- [x] `document.fullscreenEnabled === false` is handled before `requestFullscreen()`.
- [ ] Manual validation in published deployment (popup blockers vary by browser).
- [ ] Cross-browser popup-blocker validation on Chrome / Safari / Firefox after publish.

### Slide background / camera (spec: `.lovable/memory/diagnostics/01-slide-settings-fullscreen-camera-rca.md`)

- [x] 1. Unify background rendering — `ThemeWrap` + `resolveBackground()` is the single pipeline (theme → deck → per-slide → image mode).
- [x] 2. Wire darken + blur — dedicated bg layer with `filter: blur(Npx)` + `rgba(0,0,0,darken/100)` overlay, rendered in normal and fullscreen.
- [x] 3. Separate transition zoom from camera/focus zoom — `SlideTransition` is fade-only; `CameraStage` is identity; deck-level camera-zoom no longer stacks with per-step focus.
- [x] 4. Step focus indexing — both routes pass 1-based step to `CameraStage`/`getActiveFocusRegion`, 0-based to `RenderSlide`. Covered by `focus-region.test.ts`.
- [x] 5. Fullscreen stage clipping — `.slide-wrapper` uses `overflow:hidden; isolation:isolate; contain: layout paint`; shared `PresenterShell` clips viewport. Covered by `presenterShell.test.tsx`.
- [x] 6. Proposal example with right-side image — `sample-deck.json` has `media` on a `left` slide.
- [x] 7. Camera-friendly focus example — `sample-deck.json` has a `steps` slide with per-step `focus` regions.
- [x] 8. Final RCA documented — `Resolution (B19A)` section records remedies for RC1-RC6.

### Remaining (tracked elsewhere)
- [ ] Manual validation in published deployment of fullscreen Present across Chrome / Safari / Firefox popup blockers.
- [ ] Run Playwright e2e (`e2e/fullscreen-present.spec.ts`) in a CI image with Chromium system deps.
- [ ] In-app hint when `embedded-popup-blocked` is reported, with a right-click-friendly link.
