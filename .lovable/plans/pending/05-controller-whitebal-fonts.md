# Controller white-balance, step-back nav, font rendering

**Slug:** controller-whitebal-fonts
**Steps:** 8
**Status:** pending
**Created:** 2026-06-06

## Context
User reports three regressions on the presenter: (1) the white-balance slider sits outside the controller and should live inside it, (2) backward navigation does not step through multi-step slides (only forward does), (3) headings look terrible — wrong font, no bold weight, no anti-aliasing. Related captures:
- Issue: `.lovable/issues/04-controller-whitebal-step-back-fonts.md`
- Commands in effect: `.lovable/spec/commands/02-write-rca-before-implementing.md`, `.lovable/spec/commands/03-maximal-plan-enforcement.md`, `.lovable/spec/commands/04-write-rca-to-memory-and-issues.md`
- Prior pending in `.lovable/`: none found in `plans/pending/`; `.lovable/pending-issues/`, `.lovable/todo-tasks.md`, and `.lovable/camera-controller-2026-gap-tasks.md` were scanned — no overlapping items pulled into this plan.

## Steps
1. Write the root-cause analysis for all three symptoms into `.lovable/memory/` (one short RCA file) per command 04 before any code change.
2. Audit current step navigation: read `SlidePresenterPage.tsx` keyboard handler, step URL contract, and `slideStepCount` call sites — document the asymmetry between forward and back. See ./subtasks/05-controller-whitebal-fonts/SS-01-step-back-nav.md.
3. Implement the symmetric `goPrevStep()` helper and wire ArrowLeft / PageUp / `k` / swipe to it (subtask SS-01).
4. Audit the current white-balance slider component and store; identify mount point in `SlidePresenterPage.tsx`. See ./subtasks/05-controller-whitebal-fonts/SS-02-whitebal-in-controller.md.
5. Add a popover-based white-balance control inside `ControllerPill.tsx`, remove the standalone slider, keep the persisted value key intact (subtask SS-02).
6. Fix font loading + heading weight + anti-aliasing in `index.html`, `src/styles.css`, and `RenderSlide.tsx`. See ./subtasks/05-controller-whitebal-fonts/SS-03-font-rendering.md.
7. Update the shortcuts/controller parity test and the LLM guide bundle docs if any new control id is introduced; bump the controller anchor storage key only if layout actually shifts.
8. Verify end-to-end: load `/slides/3`, step forward through all sub-steps, step back through all sub-steps to the prior slide; open the white-balance popover from the controller; inspect a heading in fullscreen for Ubuntu 700 + antialiased rendering; then move this plan file to `.lovable/plans/completed/` and flip `Status: completed`.

## Verification
- RCA file exists under `.lovable/memory/`.
- Manual back-navigation across a multi-step slide lands on each step in reverse order.
- White-balance slider is no longer rendered outside the controller; popover inside the controller works and value persists across reload.
- DevTools Computed on a heading shows `font-family: Ubuntu`, `font-weight: 700`, `-webkit-font-smoothing: antialiased`; visual check at fullscreen confirms crisp bold titles.
- `bunx vitest run` (or the project's test command) passes, including the controller/shortcut parity test.

## Appended from prior pending tasks
none
