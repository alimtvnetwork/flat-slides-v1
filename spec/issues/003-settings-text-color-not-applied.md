# 003 — Settings → Text color does not visibly update slide text

**Status:** open
**Area:** SettingsDrawer + theme/CSS variable plumbing

## Symptom

User picks white in Settings → Text color. The preview shows no change. Same for the palette swatches and the “Auto (theme)” reset button.

## Root cause

`setSettings({ textColor })` writes `deck.settings.textColor` in the Zustand store, but `SlideLayout`/`RenderSlide`/`Rich` resolve text color from the active **theme** (`THEMES[id].fg`) and never consult `settings.textColor`. The CSS variable `--slide-fg` is only set from theme.fg in `ScaledSlide`. So the override is stored but never threaded into the rendered slide.

## Fix plan

1. In `ScaledSlide` (or wherever `--slide-fg` is set), prefer `deck.settings.textColor ?? theme.fg`. 2. Same precedence in any inline `color={...}` on title/body components. 3. Add a regression test `settings-text-color-applied.test.tsx` that renders a slide with `settings.textColor="#ffffff"` over a dark theme and asserts the computed style is `rgb(255,255,255)`. 4. Document precedence (settings override > theme) in `docs/slides/spec/theming.spec.md`.

## Acceptance

- Behavior described in **Symptom** no longer reproduces.
- A regression test from **Fix plan** is added and passes locally.
- Any spec doc referenced in **Fix plan** is created/updated in the same change.

## Status log

- 2026-06-06 — opened. RCA + fix plan ready. No code changes yet (per user request — fixes deferred).
