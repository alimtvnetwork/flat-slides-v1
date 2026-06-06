# Changelog

All notable changes to Glasswing are documented in this file.

## 1.8.0 — 2026-06-06

### Changed
- **Slides-first preview.** `/` now redirects to `/slides/1` so the deck is the first surface (per `.lovable/spec/commands/01-slides-first-preview.md`). Marketing/landing content moved verbatim to `/about` (`src/routes/about.tsx`).
- Updated `mem://index.md` Core with the slides-first guardrail.

### Added
- Diagnostic RCAs under `.lovable/memory/diagnostics/`: `03-root-not-slides-first-rca.md`, `04-controller-vs-spec-rca.md` (preliminary), `05-settings-vs-spec-rca.md` (preliminary).

### Resolved
- Issue `.lovable/issues/01-root-not-slides-first.md` — marked fixed by the redirect.

## 1.7.0 — 2026-06-06

### Planning
- Filed plan `.lovable/plans/pending/01-slides-first-preview.md` (30 steps) to flip `/` to a slides-first shell with a launcher exposing every spec-documented case (Present, Inspector, Handout, Handout-3up, Print, Audience, Import/Export, Settings).
- Captured commands: `01-slides-first-preview` (slides-first IA) and `02-write-rca-before-implementing` (RCA before any multi-step implementation) under `.lovable/spec/commands/`.
- Filed issue `.lovable/issues/01-root-not-slides-first.md` for the marketing-first regression on `/`.
- Created 8 subtask specs under `.lovable/plans/subtasks/01-slides-first-preview/` (RCA, IA decision, launcher cases, visual contract, controller coexistence, settings alignment, test plan, verification matrix). No code changes this release — execution scheduled for v1.8.0.
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
## [1.6.0] — 2026-06-06

### Fixed
- **Camera bubble completion (issue 005)**: fullscreen-only camera visibility now uses a shared presenter-context helper, so `?present=1` popup windows satisfy the gate without duplicating URL parsing inside `CameraBubble`. `useCamera` now logs `[slides:camera] getUserMedia failed` with browser error context before surfacing denied/error states.
- **Runtime export/import round-trip (issue 009)**: deck exports now include `meta.exportedAt` plus `meta.runtime` snapshots for camera chrome, annotations, and known `riseup.webcam.*` preferences. Imports restore that metadata through the same parse/setDeck flow and log `[slides:runtime-meta] restored deck runtime metadata` when it applies.

### Added
- `src/lib/slides/runtimeMeta.ts` + `src/lib/slides/io-runtime-meta.test.ts`
- `docs/slides/spec/import-export.spec.md`

## [1.5.0] — 2026-06-06

### Fixed
- **Image background contrast (issue 026)**: switching `backgroundMode`
  to `image` from the SettingsDrawer now auto-bumps `darken` from 0 →
  35 so default text colors stay readable over bright photos. Respects
  any non-zero value the user already chose. Auto-luminance toggle is
  the follow-up.
- **HMR stale-deck escape hatch (issue 018)**: SettingsDrawer now
  shows a dev-only "Reset cached deck" button (`import.meta.env.DEV`
  gated) that clears the zustand-persist snapshot and reseeds the
  default deck. The full migrate-on-version-bump fix is queued as a
  follow-up; this gives developers an immediate way out of stale-HMR
  loops.

### Added
- `src/components/slides/backgroundMode.ts` + test
- `src/components/slides/devResetDeck.ts` + test

## [1.4.0] — 2026-06-06

### Fixed
- **Annotations don't leak across decks (issue 019)**: confirmed
  `setDeck` clears `useAnnotations` and locked the contract with
  `annotations-cross-deck.test.ts` — the test specifically uses
  overlapping slide ids between two decks (the original bug repro).
  Chose "clear-on-replace" over `${deckId}:${slideId}` keying because
  annotations are session-only by default; wiping on import matches
  user intent and avoids a storage migration.
- **Popup presenter window loses deck on refresh (issue 020)**: added
  a cross-window `storage` event listener (`syncDeckAcrossWindows`) in
  `store.ts` that re-runs `useDeck.persist.rehydrate()` when another
  tab writes `slides-deck-v1`. Popup presenter and second editor tabs
  now pick up imports from the opener tab without a manual reload.

### Added
- `src/components/slides/annotations-cross-deck.test.ts`
- `src/components/slides/store-cross-window-sync.test.ts`
- `syncDeckAcrossWindows()` export in `src/components/slides/store.ts`

## [1.3.0] — 2026-06-06

### Fixed
- **Sample-deck pipeline lock (issue 013)**: `sample-deck.test.ts` now
  also runs the deck through the same `?raw` → `parseDeckJson` pipeline
  used by `SettingsDrawer`'s "Try spec sample deck" button. Schema drift
  fails CI before it can surface as a runtime error toast.
- **`setDeck` side-effects lock (issue 010)**: regression test asserts
  `useDeck.setDeck` clears `useAnnotations.strokes` and reseats
  `lastVisitedSlideId` on the new deck's first slide. The behaviour was
  already implemented; the lock prevents silent regression.

### Added
- `src/components/slides/store-setdeck-side-effects.test.ts`
- Raw-pipeline assertion in `src/lib/slides/sample-deck.test.ts`

## [1.2.0] — 2026-06-06

### Fixed
- **SettingsDrawer z-index (issue 016)**: drawer is now `--z-drawer: 280`,
  above the controller pill (`--z-controller: 260`) and camera bubble
  (`--z-camera: 270`). Chrome layer scale documented in
  `docs/slides/spec/z-index.spec.md`.
- **Controller overflow parity (issue 015)**: parity test locks that the
  overflow-menu Settings/Help items invoke their callbacks, so a future
  id/callback rename can't silently turn them into no-ops.
- **BroadcastChannel churn (issue 021)**: `useAudienceSync` keeps one
  channel per `sessionId` instead of recreating it on every slide
  navigation. Stable listener identity, no dropped messages mid-swap.
- **Controller anchor stuck after resize (issue 029)**: new pure
  `clampControllerAnchor` helper + resize listener in `ControllerPill`
  snaps a corner anchor back to `bottom-center` when the viewport
  shrinks below the pill's required width.

### Added
- `docs/slides/spec/z-index.spec.md` — single source of truth for the
  chrome stacking order.
- Regression locks: `SettingsDrawer.zindex.test.tsx`,
  `ControllerOverflowMenu.parity.test.tsx`, `useAudienceSync.test.ts`,
  new `clampControllerAnchor` cases in `controller-anchor.test.ts`.

## [1.1.0] — 2026-06-05

### Fixed
- **Fullscreen breakout**: slide canvas, camera bubble, and controller chrome
  now stay clipped to the scaled 1920×1080 slide frame in native fullscreen
  on all viewport sizes.
  - `ScaledSlide` writes `--presenter-frame-{left,top,right,bottom}` CSS vars
    and falls back to parent rect / `visualViewport` when the stage measures 0px.
  - `useFullscreen` targets the stable `/slides` root so portaled overlays
    share one native fullscreen surface.
  - `CameraBubble` clamps to the stage frame and clips overflowing chrome
    while in fullscreen.
  - `controller-anchor` positions anchors against the slide-frame vars
    instead of the viewport.
- Slide presenter routing: `/slides/N` and `/slides/N/S` resolve by 1-based
  index, not slide id; parent layout renders `<Outlet />`.

### Added
- Presenter inspector (B22): speaker view at `/slides/inspector/$slideId(/$step)`
  with persistent timer, scoped keymap (R/P/Esc/arrows).
- Presenter controller pill (B21): 4 anchors, hover-reveal with reduced-motion
  support, overflow menu below 1280px, single keymap registry.
- Regression tests for stage-fill camera containment, controller anchor
  clamping, fullscreen target, and ScaledSlide zero-measurement fallback.

### Changed
- Default slide transition is `fade` (not `camera-zoom`); zoom is opt-in for
  hero/title moments only.
- All animated slide surfaces consult `useReducedMotion()` from
  `@/components/slides/useReducedMotion`.

## [1.0.0] — Initial release

- JSON-driven deck format, three themes, six slide layouts, four transitions.
- Keyboard navigation, deck and single-slide import/export.
