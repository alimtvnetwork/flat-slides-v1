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
- [ ] In-app hint when `embedded-popup-blocked` is reported, with a right-click-friendly link. — **shipped** (`PresenterFallbackLink.tsx`, mounted on both slide routes).

## Active: Deck PDF export (spec: `docs/slides/spec/print-mode.spec.md`)

- [x] `/slides/print` route renders every enabled slide stacked.
- [x] `@page 1920×1080 landscape` + per-page `page-break-after` in `src/styles.css`.
- [x] Step-aware slides print at their final step so all reveals show.
- [x] SettingsDrawer "Export deck as PDF" opens `/slides/print?auto=1` in a new tab and auto-invokes `window.print()`.
- [x] `/slides/print` now shows a print instruction notice that is hidden from exported pages via `data-print-hide`.
- [x] Regression test `src/routes/slides.print.test.tsx` (1/1).
- [ ] Manual validation of resulting PDF in Chrome / Safari / Firefox.

## Active: Speaker handout export (spec: `docs/slides/spec/handout-mode.spec.md`)

- [x] `/slides/handout` route renders every enabled slide with thumbnail + notes.
- [x] Per-page CSS (`.handout-page`, `.handout-thumb`, `.handout-notes*`) in `src/styles.css` with print-mode size snap to 1920×1080.
- [x] Step-aware slides render their final reveal state.
- [x] SettingsDrawer "Export speaker handout" opens `/slides/handout?auto=1` in a new tab and auto-invokes `window.print()`.
- [x] Empty-notes pages show a muted "No speaker notes for this slide." placeholder.
- [x] Regression test `src/routes/slides.handout.test.tsx` (1/1).
- [ ] Manual validation of resulting handout PDF in Chrome / Safari / Firefox.
- [ ] Optional: 3-up handout variant (separate spec).

