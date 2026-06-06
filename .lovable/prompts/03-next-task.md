# 03 — Next Task (v5, N=2)

> Iteration 3 of the "Next N steps" workflow. N parsed from prompt header = **2**.

## Invoked

Pending plan: `.lovable/plans/pending/03-text-shadow-shortcuts-fix.md`

## Next 2 steps committed

1. **Guideline + spec audit, write one-sentence root cause.**
   - Reasoning: Past turns shipped symptom patches because the exact shadow/shortcut spec lines were never quoted. Without a root cause sentence, any code edit is a guess.
   - Time estimate: 20–30 min.
   - Unblocks: a minimal, spec-anchored edit in step 2 instead of another rewrite loop.

2. **Inspect text-shadow rendering path end-to-end.**
   - Files in scope: `src/styles.css` (the `.hl` rule), the rich-text emitter that decides which spans get `.hl`, and any slide component overriding `text-shadow`.
   - Reasoning: Shadow is declared but not visible — either `.hl` is not emitted, or a later rule resets `text-shadow`. Must be confirmed before editing.
   - Time estimate: 20–30 min.
   - Unblocks: step 3 (minimal styling fix) with zero forbidden glow/blur.

## Remaining items (from the same plan, in order)

3. Apply the minimum styling/rendering fix so the required shadow renders on the intended spans, white text preserved.
4. Inspect runtime keyboard path for `I` and `F` (focus guards, capture listeners, `SHORTCUTS`, `presenterActions`, Present button wiring).
5. Apply the minimum shortcut fix so `I` and `F` fire from the slides-first preview without an extra click.
6. Update focused tests for shadow contract + `I`/`i` and `F`/`f` dispatch + Present button.
7. Run the targeted test set and verify in preview (`/` opens slide 1, shadow visible, Present works, `F` fullscreens, `I` toggles camera).
8. Move plan to `.lovable/plans/completed/03-text-shadow-shortcuts-fix.md`, flip `Status: completed`.

## Appended prior pending tasks (still queued after plan 03)

- `.lovable/plans/pending/01-slides-first-preview.md`
- `.lovable/plans/pending/02-present-fullscreen-preview-fix.md`
- `.lovable/plans/subtasks/01-slides-first-preview/01-rca-root-landing.md`
- `.lovable/plans/subtasks/01-slides-first-preview/02-ia-decision.md`
- `.lovable/plans/subtasks/01-slides-first-preview/04-launcher-visual-contract.md`
- `.lovable/plans/subtasks/01-slides-first-preview/05-controller-coexistence.md`

## Version

Bumped to `1.22.0` in `package.json`, pinned in `README.md`, changelog entry added.
