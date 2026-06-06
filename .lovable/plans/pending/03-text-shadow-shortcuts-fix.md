# Text shadow and shortcut reliability fix

**Slug:** text-shadow-shortcuts-fix
**Steps:** 8
**Status:** pending
**Created:** 2026-06-06

## Context

The user reports two unresolved regressions: the specified slide text shadow is not visible, and presenter shortcuts still do not work reliably. This plan targets the slide styling path plus the presenter shortcut/action path without implementing changes in this planning turn.

Captured command: `.lovable/spec/commands/03-maximal-plan-enforcement.md`
Captured issue: `.lovable/issues/02-slide-text-shadow-and-shortcuts-broken.md`

## Steps

1. Re-read the applicable coding, error-management, slide-shadow, and presenter shortcut specs before touching code; document the exact root cause sentence first. See ./subtasks/03-text-shadow-shortcuts-fix/01-guidelines-and-spec-audit.md.
2. Inspect the active slide rendering path to confirm whether highlighted/rich text emits `.hl` and whether `src/styles.css` applies the exact required crisp shadow. See ./subtasks/03-text-shadow-shortcuts-fix/02-text-shadow-enforcement.md.
3. Apply the minimal styling/rendering fix so the required text shadow is visible on the slide text that should receive it, while preserving pure white slide text and avoiding forbidden glow/blur effects.
4. Inspect the runtime keyboard path for `I` and `F`, including focus guards, capture listeners, `SHORTCUTS`, `presenterActions`, and the visible Present button wiring. See ./subtasks/03-text-shadow-shortcuts-fix/03-shortcut-diagnostics-and-fix.md.
5. Apply the minimal shortcut fix so `I` toggles/acquires the camera and `F` enters presentation/fullscreen from the slides-first preview without requiring an extra click.
6. Update focused tests for the text-shadow rendering contract and for `I`/`i` plus `F`/`f` shortcut behavior, including the Present button path.
7. Run the targeted test set and inspect browser/preview signals to verify the active slide starts first, the shadow is visible, and shortcuts fire in the user-visible environment.
8. Move this plan to `.lovable/plans/completed/03-text-shadow-shortcuts-fix.md` after the implementation is verified, flipping `Status:` to `completed` and preserving the subtask status trail.

## Verification

Verification will use focused unit/component tests for highlight rendering and shortcut dispatch, plus preview validation that `/` opens the first slide, the specified text shadow is visible, the Present button works, `F` enters presentation/fullscreen, and `I` opens/toggles the camera. Browser console/runtime errors must be checked before claiming the fix is complete.

## Appended from prior pending tasks

- `.lovable/plans/pending/01-slides-first-preview.md` — slides-first preview and controller/settings alignment remains pending.
- `.lovable/plans/pending/02-present-fullscreen-preview-fix.md` — Present/F preview fullscreen reliability remains pending.
- `.lovable/plans/subtasks/01-slides-first-preview/01-rca-root-landing.md` — RCA for root landing remains pending.
- `.lovable/plans/subtasks/01-slides-first-preview/02-ia-decision.md` — IA decision for slides-first routes remains pending.
- `.lovable/plans/subtasks/01-slides-first-preview/04-launcher-visual-contract.md` — launcher visual contract remains pending.
- `.lovable/plans/subtasks/01-slides-first-preview/05-controller-coexistence.md` — controller/launcher coexistence remains pending.