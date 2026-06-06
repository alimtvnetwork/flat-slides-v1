# spec/issues — Bug RCAs

Each file is a self-contained root-cause analysis (RCA) + fix plan + acceptance
criteria for one defect. Status is updated when the fix lands.

| # | File | Title | Status |
|---|------|-------|--------|
| 001 | [`001-preview-iframe-fullscreen.md`](./001-preview-iframe-fullscreen.md) | Present-from-preview-iframe is silently unsupported | fixed |
| 002 | [`002-step-transition-black-flash.md`](./002-step-transition-black-flash.md) | Slide-4 step→step shows a black flash | fixed |
| 003 | [`003-settings-text-color-not-applied.md`](./003-settings-text-color-not-applied.md) | Settings → Text color does not visibly update slide text | fixed |
| 004 | [`004-settings-changes-no-preview-update.md`](./004-settings-changes-no-preview-update.md) | Editing any Settings drawer control sometimes does not re-render the slide | fixed |
| 005 | [`005-camera-bubble-never-mounted.md`](./005-camera-bubble-never-mounted.md) | Camera bubble does not appear even when “Show camera” is enabled | open |
| 006 | [`006-camera-shape-test-uses-removed-prop.md`](./006-camera-shape-test-uses-removed-prop.md) | `CameraBubble.shape.test.tsx` exercises an API the component no longer exposes | fixed |
| 007 | [`007-import-deck-input-not-clicked.md`](./007-import-deck-input-not-clicked.md) | “Import deck” button shows the file dialog inconsistently in Safari | fixed |
| 008 | [`008-import-deck-toast-truncates-zod-error.md`](./008-import-deck-toast-truncates-zod-error.md) | Import failure toast hides the offending JSON path past 4 errors | fixed |
| 009 | [`009-export-deck-loses-runtime-state.md`](./009-export-deck-loses-runtime-state.md) | Exported deck JSON does not round-trip presenter annotations or camera prefs | open |
| 010 | [`010-import-deck-skips-store-replacement-side-effects.md`](./010-import-deck-skips-store-replacement-side-effects.md) | Importing a deck does not reset slide index, annotations, or audience state | open |
| 011 | [`011-schema-rejects-base64-images-over-1mb.md`](./011-schema-rejects-base64-images-over-1mb.md) | Importing a deck with embedded base64 images can silently fail validation | fixed |
| 012 | [`012-node-build-deck-script-missing.md`](./012-node-build-deck-script-missing.md) | There is no Node.js script that compiles deck JSON into a deployable bundle | open |
| 013 | [`013-sample-deck-json-not-validated-in-ci.md`](./013-sample-deck-json-not-validated-in-ci.md) | `docs/slides/spec/sample-deck.json` is not validated in CI | open |
| 014 | [`014-preview-fullscreen-breaks-out-of-iframe.md`](./014-preview-fullscreen-breaks-out-of-iframe.md) | Pressing F/Present in preview iframe escapes to top window unexpectedly | open |
| 015 | [`015-presenter-controller-settings-button-hidden-at-narrow-width.md`](./015-presenter-controller-settings-button-hidden-at-narrow-width.md) | Settings gear vanishes from controller pill below 1280 CSS px | fixed |
| 016 | [`016-settings-drawer-zindex-blocked-by-controller-pill.md`](./016-settings-drawer-zindex-blocked-by-controller-pill.md) | SettingsDrawer can render under the controller pill on some routes | fixed |
| 017 | [`017-scaled-slide-zero-height-when-parent-flex.md`](./017-scaled-slide-zero-height-when-parent-flex.md) | ScaledSlide renders 0 px tall inside flex parents that don’t set `min-height` | fixed |
| 018 | [`018-stale-deck-after-hmr.md`](./018-stale-deck-after-hmr.md) | HMR after editing slide content sometimes shows the previous slide JSON | open |
| 019 | [`019-annotations-not-cleared-between-decks.md`](./019-annotations-not-cleared-between-decks.md) | Annotations from a previous deck render on the new deck after import | open |
| 020 | [`020-presenter-window-loses-deck-on-hard-refresh.md`](./020-presenter-window-loses-deck-on-hard-refresh.md) | Refreshing the popup presenter window resets to the default sample deck | open |
| 021 | [`021-broadcastchannel-leak-on-route-change.md`](./021-broadcastchannel-leak-on-route-change.md) | BroadcastChannel listeners accumulate on each slide navigation | fixed |
| 022 | [`022-deck-music-autoplay-blocked-without-gesture.md`](./022-deck-music-autoplay-blocked-without-gesture.md) | Deck music never starts in the preview iframe | open |
| 023 | [`023-rich-text-highlights-strip-on-import.md`](./023-rich-text-highlights-strip-on-import.md) | Imported decks lose `.hl` highlight spans authored as `<mark>` | fixed |
| 024 | [`024-focus-region-svg-paths-not-validated.md`](./024-focus-region-svg-paths-not-validated.md) | Focus regions referencing missing SVG ids silently render no zoom | fixed |
| 025 | [`025-settings-persistence-throws-on-quota.md`](./025-settings-persistence-throws-on-quota.md) | SettingsDrawer changes are lost when localStorage quota is full | fixed |
| 026 | [`026-themes-fg-mismatch-with-background-image.md`](./026-themes-fg-mismatch-with-background-image.md) | Theme `fg` is unreadable over user-supplied background image | open |
| 027 | [`027-rich-component-renders-html-entities-literally.md`](./027-rich-component-renders-html-entities-literally.md) | `&amp;` and `&mdash;` render as literal text in slide bodies | fixed |
| 028 | [`028-presenter-inspector-timer-resets-on-route-change.md`](./028-presenter-inspector-timer-resets-on-route-change.md) | Inspector timer resets when navigating between slides | fixed |
| 029 | [`029-controller-pill-anchor-stuck-after-resize.md`](./029-controller-pill-anchor-stuck-after-resize.md) | Controller pill anchor sticks to old corner after the window is resized | open |
| 030 | [`030-keyboard-shortcut-conflicts-with-browser.md`](./030-keyboard-shortcut-conflicts-with-browser.md) | `Cmd+P` (Print) is intercepted by the deck and breaks browser print | fixed |
| 031 | [`031-node-render-script-missing.md`](./031-node-render-script-missing.md) | No headless Node renderer to produce PNG/PDF previews of slides | open |
| 032 | [`032-import-button-accepts-any-file-extension.md`](./032-import-button-accepts-any-file-extension.md) | Import deck accepts `.txt`, `.png`, anything — fails late with cryptic JSON error | fixed |

## Conventions

- One issue per file. Filename `NNN-short-slug.md`, 3-digit zero-padded.
- Sections in order: **Symptom**, **Repro**, **Investigation**, **Root cause**,
  **Fix plan**, **Acceptance**, **Regression test**, **Status log**.
- Update the table above and the file's **Status log** when status changes
  (`open` → `in-progress` → `fixed`).
- Link the regression test from both the table and the file body so anyone
  can verify the lock without re-deriving the RCA.

## Core memory audit (2026-06-06)

Confirmed the following rules still hold for slide/step rendering:

- **Default transition is `fade`** — `SlideTransition.resolveSlideTransition`
  (`SlideTransition.tsx:36–48`) returns `fadeTransition()` unless the deck
  explicitly opts into `camera-zoom`. ✓
- **Steps/timeline never zoom** — `canUseCameraZoom()`
  (`SlideTransition.tsx:30–34`) returns `false` for both. ✓
- **`useReducedMotion` is consulted** — both `SlideTransition` and `CameraStage`
  import it from `./useReducedMotion`. ✓
- **Step URLs are 1-based** — slide layout at `src/routes/slides.$slideId.tsx`
  passes `slideId` through; `SlidePresenterPage` resolves via
  `slides[Number(slideId)-1]`. ✓

**Only documented `scale(...)` use:** `CameraStage.focusTransform()` for
authored focus regions on non-step slides. Issue 002 stays within Core memory
because the proposed fix only touches the steps-slide detail-pane crossfade
(opacity + ≤16 px translate), never adds scale.
