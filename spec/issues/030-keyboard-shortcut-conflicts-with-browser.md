# 030 — `Cmd+P` (Print) is intercepted by the deck and breaks browser print

**Status:** open
**Area:** presenterActions / SHORTCUTS

## Symptom

Users expect `Cmd+P` to open the browser print dialog. The deck eats it to toggle Presenter view.

## Root cause

`presenterActions.ts` registers `Cmd+P` without checking `e.metaKey` vs `e.key === 'p'` collision rules.

## Fix plan

1. Use `Shift+P` (or `F5`) for Presenter; leave `Cmd+P` to the browser. 2. Add a “Keyboard shortcuts” dialog showing the final map. 3. Update `KeyboardShortcutsDialog`.

## Acceptance

- Behavior described in **Symptom** no longer reproduces.
- A regression test from **Fix plan** is added and passes locally.
- Any spec doc referenced in **Fix plan** is created/updated in the same change.

## Status log

- 2026-06-06 — opened. RCA + fix plan ready. No code changes yet (per user request — fixes deferred).

- 2026-06-06 — **fixed**. Root cause was `matchesShortcut` ignoring modifier state; Cmd/Ctrl/Alt + any catalogued key would still match. Added a modifier guard in `shortcuts.ts` that rejects events with `metaKey | ctrlKey | altKey` set (Shift remains allowed for `?`). Cmd+P / Ctrl+P now fall through to the browser. Regression: `src/components/slides/shortcuts-modifier-guard.test.ts` (5/5 green).
