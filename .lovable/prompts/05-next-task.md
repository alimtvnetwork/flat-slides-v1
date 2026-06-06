# 05 — Next Task (v5, N=2)

Iteration 5. N=2.

## Steps executed this turn (plan 03, steps 4 + 5)

1. **Inspect runtime keyboard path for I/F.** Read `src/components/slides/SlidePresenterPage.tsx` (keydown handler 167-227, capture listeners 239-242, `isPresenterFullscreenShortcut` 497-499, `isHiddenPresenterChromeShortcut` 487-495), `presenterActions.ts` (toggle-camera/webcam-hard-toggle 77-80), `shortcuts.ts` (SHORTCUTS table + `matchShortcut`), `PresenterShell.tsx` (auto-focus, tabIndex=-1), `chrome-store.ts` (toggleCamera flips `camera.visible`), `controls/CameraBubble.tsx` (mounts at line 437, runs getUserMedia when visible).
   - **Root cause (one sentence):** `target?.closest(...)` at line 176 was called without checking that target was an `Element`; for window/document-level keydown events `event.target` is the `Document` (no `.closest`), so the handler threw a silent `TypeError` before reaching `dispatchPresenterKey`, killing `I` and every other registry key while `F` survived via the early branch.

2. **Minimum fix + verify.** Guarded `event.target` with `instanceof Element` before calling `.closest`. Tests: `bunx vitest run SlidePresenterPage.keyboard.test.ts presenterActions.test.ts` → 10/10 green.

## Remaining items (plan 03)

6. Add a regression test for keydown dispatched with `event.target = document` to lock the I/F path.
7. Preview verification: confirm `I` toggles camera and `F` enters presentation on the live preview.
8. Move plan to `.lovable/plans/completed/03-text-shadow-shortcuts-fix.md`.

Prior pending plans still queued:
- `01-slides-first-preview` (+ subtasks 01 RCA, 02 IA, 04 launcher visual, 05 controller coexistence)
- `02-present-fullscreen-preview-fix`

## Version

`1.23.0 → 1.24.0`. Pinned in `README.md`, changelog entry added.
