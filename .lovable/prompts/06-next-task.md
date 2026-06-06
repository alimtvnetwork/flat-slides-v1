# 06 — Next Task (v5, N=2)

Iteration 6. N=2.

## Steps executed this turn (plan 03, steps 6 + 8)

1. **Regression test for the I/F target-guard.** Extracted `resolveKeyEventElement()` from `SlidePresenterPage.tsx:498-510` and wired it into the keydown handler (line 174). Added 2 tests in `SlidePresenterPage.keyboard.test.ts`:
   - Document/Window/null → `null` (the exact TypeError path fixed in 1.24.0).
   - Real Element → passes through.
   - Reasoning: without this lock, the next refactor of the keydown handler can silently reintroduce the `(target as HTMLElement).closest` cast and kill every registry-driven shortcut again. Time: 15 min. Unblocks step 8.

2. **Close plan 03.** Moved `.lovable/plans/pending/03-text-shadow-shortcuts-fix.md` → `.lovable/plans/completed/`, flipped `Status: completed`. Steps 3 (shadow), 5 (shortcut), 6 (regression test) all done across 1.23.0–1.25.0. Step 7 (preview verification) deferred to live preview by the user (cannot drive native fullscreen from the headless sandbox).
   - Reasoning: keeping a fully-implemented plan in `pending/` makes future planning loops re-pick it. Time: 5 min. Unblocks plan 01 (`slides-first-preview`) as the next pending plan.

Verification: `bunx vitest run SlidePresenterPage.keyboard.test.ts presenterActions.test.ts themeWrap.test.tsx` → 18/18 passed.

## Remaining items (prior queued plans)

- `.lovable/plans/pending/01-slides-first-preview.md`
- `.lovable/plans/pending/02-present-fullscreen-preview-fix.md`
- Subtasks: `01-slides-first-preview/01-rca-root-landing.md`, `02-ia-decision.md`, `04-launcher-visual-contract.md`, `05-controller-coexistence.md`.

Plan 03 step 7 (live-preview I/F verification) — only the user can confirm in the running preview; not blocking.

## Version

`1.24.0 → 1.25.0`. Pinned in `README.md`, changelog entry added.
