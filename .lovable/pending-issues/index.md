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
- [x] 3. Separate transition zoom from camera/focus zoom — `camera-zoom` is opt-in, never default, and falls back to fade for steps/timeline/focus slides; `CameraStage` handles focus-region zoom.
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

## Active: 3-up speaker handout export (spec: `docs/slides/spec/handout-3up-mode.spec.md`)

- [x] `/slides/handout-3up` route renders enabled slides in groups of three per page.
- [x] Per-page CSS (`.handout-threeup-page`, `.handout-threeup-row`, `.handout-threeup-lines`) in `src/styles.css` with print-mode snap to 1920×1080.
- [x] Step-aware slide thumbnails render their final reveal state.
- [x] SettingsDrawer "Export 3-up handout" opens `/slides/handout-3up?auto=1` and auto-invokes `window.print()`.
- [x] Regression test `src/routes/slides.handout-3up.test.tsx` covers chunking and hidden print instructions.
- [ ] Manual validation of resulting 3-up handout PDF in Chrome / Safari / Firefox.

## Active: Command palette export entries

- [x] CommandPalette surfaces "Export deck as PDF", "Export speaker handout", and "Export 3-up handout" (open `?auto=1` in new tab).

## Active: Export paper-size selection (spec: `docs/slides/spec/export-paper-size.spec.md`)

- [x] Shared export paper helper parses `paper=wide|letter|a4` with safe fallback.
- [x] `/slides/print`, `/slides/handout`, and `/slides/handout-3up` apply `data-paper` to root export containers.
- [x] CSS named pages and custom properties support Wide, Letter, and A4 landscape export geometry.
- [x] SettingsDrawer exposes Wide / Letter / A4 controls for each export type.
- [x] CommandPalette keeps quick exports as Wide/default exports.
- [x] Regression tests cover helper parsing, URL generation, and route-level paper application.


## Active: Presenter controller pill (B21 — spec: `.lovable/memory/diagnostics/02-fullscreen-and-settings-rca.md`, feature card: `mem://features/presenter-controller-pill`)

- [x] 4 anchors persisted to `riseup.controller.anchor`; cycle via right-click or `B` shortcut.
- [x] Hover-reveal collapsed state (160ms expand / 400ms grace), zeroed under `prefers-reduced-motion`.
- [x] Overflow menu (`More controls`) below 1280px viewport; inline Settings/Help ≥1280px.
- [x] Single keymap contract: SHORTCUTS `id` + `presenterActions.ts` registry, parity test enforces drift.
- [x] Playwright happy-path coverage (`e2e/controller-happy-path.spec.ts`) — anchor cycling, narrow + wide viewports.
- [x] Reduced-motion + a11y audit (`useHoverReveal` honours `prefers-reduced-motion`; ControllerPill gates framer-motion; ControllerOverflowMenu uses Radix labelled triggers).
- [ ] Manual cross-browser validation of controller hover-reveal + anchor cycling on Chrome / Safari / Firefox (post-publish).

