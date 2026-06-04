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

### Slide background / camera (unchanged from previous spec)

1. **Unify background rendering** — one slide background pipeline (theme defaults + deck + per-slide + image mode + darken + blur).
2. **Wire darken + blur controls** — render from `deck.settings.darken/blur` in normal and fullscreen.
3. **Separate transition zoom from camera/focus zoom** — prefer fade/morph for slide-to-slide; reserve camera zoom for authored focus regions.
4. **Fix step focus indexing** — pass 1-based step numbers to `CameraStage` / `getActiveFocusRegion` consistently.
5. **Harden fullscreen stage clipping** — fixed shell, stage, transition layer, camera layer all clip to the intended viewport without layout shifts.
6. **Add proposal example with right-side image** — `media` on the right.
7. **Add camera-friendly proposal/focus example** — focus regions land on intended image/text regions.
8. **Document final decision** — update `.lovable/memory/diagnostics/01-slide-settings-fullscreen-camera-rca.md` with implemented remedy.
