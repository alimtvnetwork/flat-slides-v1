# 04 — Next Task (v5, N=2)

Iteration 4. N=2.

## Steps executed this turn

1. **Audit + root cause** — Read `src/styles.css` (`.hl` rule line 228-232, `--slide-text-shadow` decl line 176, comment line 174-176), `src/components/slides/themes.ts` (`themeStyle` line 111-126, light-on-dark branch line 114-115), `src/components/slides/RenderSlide.tsx` (`applyDarkPresetTokens` line 57-62, called at line 75), `src/components/slides/Rich.tsx` (.hl emitter line 21), and existing tests (`themeWrap.test.tsx:53-61`, `highlight-style-guardrails.test.ts`).
   - **Root cause (one sentence):** `applyDarkPresetTokens` set `--slide-text-shadow: none` for the dark preset, which is the exact light-on-dark case where the spec REQUIRES the ink-stamp shadow.

2. **Minimum fix** — In `applyDarkPresetTokens`, set `--slide-text-shadow` to the canonical `rgb(0 0 0) 1px 0.7px 0px` instead of stripping it. Updated `themeWrap.test.tsx:60` to assert the new contract.
   - Verified: `vitest run themeWrap + themes + highlight-style-guardrails` → 16/16 green.

## Remaining items (plan `03-text-shadow-shortcuts-fix`)

4. Inspect runtime keyboard path for `I` and `F`.
5. Apply minimum shortcut fix.
6. Add tests for `I`/`F` dispatch + Present button.
7. Run targeted tests + preview verification.
8. Move plan to `.lovable/plans/completed/`.

Prior pending plans still queued:
- `01-slides-first-preview` (+ subtasks 01 RCA, 02 IA, 04 launcher visual, 05 controller coexistence)
- `02-present-fullscreen-preview-fix`

## Version

`1.22.0 → 1.23.0`. Pinned in `README.md`, changelog entry added.
