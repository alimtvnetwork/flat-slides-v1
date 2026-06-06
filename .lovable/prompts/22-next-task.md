# Prompt 22 — Next 2 Tasks (plan 05, post SS-01/SS-03)

## Files read
- `.lovable/plans/pending/05-controller-whitebal-fonts.md`
- `src/components/slides/SlidePresenterPage.tsx` (lines 313-337 — `movePrevStepAware`)
- `src/components/slides/useSlideNavigation.ts` (lines 43-90 — `goTo`, `prev`)
- `src/routes/__root.tsx` (line 101 — Ubuntu wght 400;500;700 already loaded)
- `src/styles.css` (lines 143-215 — body + `.slide-content`)
- `src/components/slides/RenderSlide.tsx` (lines 145-170)
- `src/components/slides/controls/ControllerPill.tsx`

## Root causes (one sentence each)
- **SS-01:** None — back-step nav was already symmetric (`movePrevStepAware` decrements `step`, `prev()` lands on previous slide's `lastStep`). Closed without code change.
- **SS-03:** `.slide-content` lacked `-webkit-font-smoothing: antialiased`, so 700-weight Ubuntu rendered as blurry sub-pixel text on the CSS-scaled 1920×1080 surface — Ubuntu weights were already loaded.

## Fix shipped in 1.41.0
- `src/styles.css` body + `.slide-content`: `-webkit-font-smoothing: antialiased`, `-moz-osx-font-smoothing: grayscale`, `text-rendering: optimizeLegibility`, `font-feature-settings: "kern" 1, "liga" 1`.

## Next 2 steps

### Step 1 — SS-02 White-balance slider inside ControllerPill (~50 min)
- **Reasoning:** Floating white-balance slider mounts outside the controller, breaking the single-chrome contract and overlapping content. Until it lives in a `ControllerPill` popover, users can't dismiss it and screenshots stay cluttered.
- **Time:** ~50 min — add WB popover trigger in `ControllerPill.tsx`, mount existing slider inside `Popover`, remove standalone mount in `SlidePresenterPage.tsx`, preserve `riseup.whitebal` localStorage key, add new SHORTCUT id + `presenterActions.ts` entry, run parity test.
- **Unblocks:** End-to-end verification + plan 05 closure.

### Step 2 — End-to-end verification + plan closure (~25 min)
- **Reasoning:** Plan 05 explicitly requires a single verification pass (3-step forward+back, popover persistence reload, fullscreen Computed heading weight) before move-to-completed. Skipping leaves the regression-fix unaudited.
- **Time:** ~25 min — manual preview pass + screenshot diff, move plan 05 → `.lovable/plans/completed/`, flip `Status: completed`.
- **Unblocks:** Next plan can start clean.

## Remaining after these 2
- None for plan 05. Next plan to be scoped from `.lovable/issues/` backlog.
