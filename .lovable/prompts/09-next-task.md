# 09 — Next Task

Verbatim "Next N Steps v5" prompt (N=2). This turn executed Step 2: highlight-color picker.

- Root cause: Settings drawer exposed text-color but not the new yellow highlighter (`--slide-hl`), so user could not re-tint highlights and felt "settings don't change anything" for highlight visuals.
- Fix: added `hlColor?: string` to `DeckSettings` (`types.ts:235`, `schema.ts:202`), threaded `--slide-hl` override in `RenderSlide` `ThemeWrap` (lines 85–87), added Highlight-color section in `SettingsDrawer.tsx` (color input + Auto reset + 6 swatches) under Text-color.
- Tests: new `settings-hl-color-applied.test.tsx` 2/2 green; text-color + persistence + store tests still green.
- Bumped 1.27.0 → 1.28.0, README pinned, CHANGELOG entry added.

Next: Guide download (ZIP llm-guideline.md + sample-deck.json via fflate), then RCA write-ups + `.hl` background regression test.
