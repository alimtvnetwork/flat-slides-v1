# Changelog

All notable changes to Glasswing are documented in this file.
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
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
