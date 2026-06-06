# 08 — Next Task

Verbatim "Next N Steps v5" prompt (N=2). This turn executed Step 1: fullscreen-from-iframe fix.

- Root cause (one sentence): `enterFullscreen` returned `{mode:"app"}` for every embedded context, so the Lovable preview iframe rendered a `position:fixed inset:0` cover bounded by the iframe viewport instead of opening a top-level presenter window that can request true browser fullscreen.
- Fix: embedded branch now calls `openPresenterWindow()` first; success → `{mode:"presenter-window"}` + clear app-presentation mode; null → `{ok:false, reason:"embedded-popup-blocked"}` (existing toast + fallback URL surface it).
- Tests: 6 tests in `fullscreenTarget.test.ts` rewritten to lock the new contract. 13/13 pass.
- Bumped 1.26.0 → 1.27.0, pinned in README, CHANGELOG entry added.

Next: Step 2 — text-color + highlight-color pickers in SettingsDrawer + thread `--slide-hl` override through ThemeWrap.
