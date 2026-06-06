# Prompt 21 — Next 2 Tasks (plan 05)

Active plan: `.lovable/plans/pending/05-controller-whitebal-fonts.md`
Issue: `.lovable/issues/04-controller-whitebal-step-back-fonts.md`

## Files read
- `.lovable/plans/pending/05-controller-whitebal-fonts.md`
- `.lovable/plans/subtasks/05-controller-whitebal-fonts/SS-01-step-back-nav.md`
- `.lovable/plans/subtasks/05-controller-whitebal-fonts/SS-02-whitebal-in-controller.md`
- `.lovable/plans/subtasks/05-controller-whitebal-fonts/SS-03-font-rendering.md`
- `src/components/slides/SlidePresenterPage.tsx`
- `src/components/slides/RenderSlide.tsx`
- `src/components/slides/controls/ControllerPill.tsx`
- `src/styles.css`, `index.html`

## Next 2 steps (exactly 2)

### Step 1 — SS-01 Symmetric back-step navigation
- **Root cause (1 sentence):** ArrowLeft / PageUp / `k` / swipe-right route through `goPrev()` which decrements `slideIndex` directly, never decrementing the active `step` on `steps`/`timeline` slides, so back is asymmetric to `moveNextStepAware()`.
- **Reasoning:** Until back mirrors forward, multi-step slides are one-way; presenter cannot recover from an over-advance. Blocks all live-demo trust.
- **Time:** ~45 min — add `goPrevStep()` helper in `SlidePresenterPage.tsx`, wire all back-direction inputs through it, land on `lastStep` of previous slide at boundary, add vitest for the step→step and slide-boundary cases.
- **Unblocks:** Trustworthy navigation baseline → SS-02 can be reviewed without confounds.

### Step 2 — SS-03 Heading font weight + anti-aliasing
- **Root cause (1 sentence):** `index.html` loads Ubuntu at weight 400 only and `.slide-canvas` has no `-webkit-font-smoothing`, so 700-weight headings synthesize a faux-bold that renders blurry — exactly the "terrible fonts" the user keeps reporting.
- **Reasoning:** Visual quality dominates every screenshot; until fixed, SS-02 popover work cannot be visually reviewed.
- **Time:** ~30 min — extend Ubuntu `<link>` weights to `400;500;700`, restore `--slide-title-weight: 700` in `RenderSlide.tsx`, add `-webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; text-rendering: optimizeLegibility;` to `.slide-canvas` in `src/styles.css`, verify Computed weight in fullscreen DevTools.
- **Unblocks:** Clean visual baseline for SS-02 review.

## Remaining after these 2
3. **SS-02** — Move white-balance slider into `ControllerPill` popover; remove standalone floating mount; preserve `riseup.whitebal` persistence key.
4. **Parity + docs** — Update `presenterActions.ts` registry and `shortcuts.ts` parity test if new action id is added; bump `riseup.controller.anchor` only if layout shifts.
5. **End-to-end verification** — 3-step slide forward+back, popover open/close + persistence reload, heading Computed style in fullscreen, capture before/after screenshots.
6. **Plan closure** — Move `05-controller-whitebal-fonts.md` → `.lovable/plans/completed/`, flip `Status: completed`.
