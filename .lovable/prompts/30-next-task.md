# 30 — Next Task v5 (active repair plan re-pin)

## Files and signals read before selecting work

- `.lovable/coding-guidelines.md:1-23` — coding rules exist and apply; `spec/coding-guidelines/` and `.lovable/seo-guidelines.md` were checked and were absent.
- `.lovable/memory/index.md:1-29` — active memory confirms no default camera zoom, no `.hl` glow, presenter controller/inspector constraints.
- `.lovable/plan.md:1-42` — current active plan is the 10-step repair pass: fullscreen persistence, slide-4 step animation, white text, highlight shadow, regression coverage, and task tracking.
- `.lovable/plans/pending/06-slide-types-themes-llm-controller.md:46-85` — older Plan 06 still exists, but it is not the immediate active repair plan named by `.lovable/plan.md`.
- `src/components/slides/useFullscreen.ts:130-174` — `enterFullscreen()` activates app presentation mode, targets the stable slides root, and logs native fullscreen failures.
- `src/components/slides/useSlideNavigation.ts:43-75` — navigation emits `slides:fullscreen-url-change` only when `document.fullscreenElement` exists.
- `src/components/slides/SlidePresenterPage.tsx:124-164` — native-fullscreen route changes are virtualized through `fullscreenPathname`; app-presentation route changes still navigate normally.
- `src/components/slides/RenderSlide.tsx:236-323` — `StepsSlide` already uses a persistent `StepDetailPane`, future-step blur/lower opacity, and no scale/camera zoom.
- `src/styles.css:161-188, 244-268` — default `--slide-fg` is true white; `.hl` has exact ink-stamp text shadow, but `.hl-pill` still has box-shadow.
- Dev-server logs — no actionable runtime stack trace; only Vite startup/restart lines and `[vite] connected`.

## Root cause

The next-task prompt registry was stale because prompt 29 kept re-pinning Plan 06 even though `.lovable/plan.md` now defines the active repair work as fullscreen persistence, slide-4 step animation, default white text, and highlight-shadow cleanup.

## Next 3 Steps — exactly 3

### Step 1 — Prove and repair fullscreen persistence across navigation
- **Reasoning:** `.lovable/plan.md:15-19` makes fullscreen persistence the first live failure. `useSlideNavigation.ts:54-57` only virtualizes route changes when `document.fullscreenElement` exists, so app-presentation mode can still navigate the route directly; if skipped, Present can still appear to exit or remount on slide advance.
- **Time:** ~70 min (15 reproduce/log, 20 trace state machine, 20 minimum fix, 15 focused test/preview verification).
- **Unblocks:** Stable presentation shell for every later visual/animation fix.

### Step 2 — Prove and repair slide-4 step 2→3 black-frame transition
- **Reasoning:** `.lovable/plan.md:21-25` names the step transition as the second live failure. `RenderSlide.tsx:236-323` has a persistent detail pane, but the black frame still needs a preview/log proof tied to slide 4's real data; if skipped, animation changes risk becoming another symptom patch.
- **Time:** ~65 min (15 reproduce at `/slides/4/2 → /slides/4/3`, 15 inspect keys/background/remounts, 20 minimum transition fix, 15 reduced-motion + focused test verification).
- **Unblocks:** Safe step-state polish and confidence that steps/timeline slides do not flash black during navigation.

### Step 3 — Lock visual rules: white default text, no highlight glow, regression coverage
- **Reasoning:** `.lovable/plan.md:27-33` requires true-white default copy, exact yellow-highlight shadow, and tests before closure. `src/styles.css:163` already sets true white and `.hl` is correct at lines 247-256, but `.hl-pill` still has box-shadow at lines 266-268; if skipped, the repair plan can be falsely closed while a forbidden glow/shadow style remains.
- **Time:** ~60 min (15 audit text/highlight styles, 15 minimum CSS fix, 20 regression tests, 10 task-tracking updates).
- **Unblocks:** Closing the active repair plan honestly, with changelog/task files updated only for verified fixes.

## Remaining items after those 3

### Active repair plan in `.lovable/plan.md`
- Steps 1-3: Reproduce fullscreen failure, trace fullscreen state machine, fix fullscreen persistence — Next Step 1.
- Steps 4-6: Trace slide-4 step data, replace black-frame transition, set step-state hierarchy — Next Step 2 covers the failure and transition; hierarchy remains if not fully covered in the same pass.
- Steps 7-8: Default white text and exact highlight/no-glow enforcement — Next Step 3.
- Step 9: Regression coverage for fullscreen persistence, embedded fallback, no black-frame/remount, step-state styling, default foreground, and `.hl` no glow — Next Step 3 starts/lands the focused coverage required for closure.
- Step 10: Validate and update `spec/issues/001-preview-iframe-fullscreen.md`, `spec/issues/002-step-transition-black-flash.md`, `spec/issues/README.md`, and `.lovable/pending-issues/index.md` without falsely closing post-publish checks.

### Plan 06 still pending after the active repair plan
- Phase A Steps 1-20: command/spec/RCA work for Ubuntu headers, ellipsis pagination, new slide-type catalog, new theme catalog, LLM guideline outline, schema/media specs, launcher docs, and memory-index updates.
- Phase B Steps 21-25: Ubuntu regression lock, including computed-style title test and visual check.
- Phase C Steps 26-32: slide-indicator ellipsis, threshold setting, go-to popover, pagination tests, and 25-slide e2e.
- Phase D Steps 33-67: shared primitives plus 35 new slide renderers.
- Phase E Steps 68-77: sample-based and additional themes, schema/docs updates, picker grouping, round-trip tests.
- Phase F Steps 78-92: LLM JSON guideline rewrite, Teams/themes/controller sections, rebuilt sample deck, public mirrors, launcher downloads.
- Phase G Steps 93-100: build/test/visual QA, preview checks, memory notes, move Plan 06 to completed, post-mortem.

## Verification for this prompt turn

- **Before:** package + README pin `1.48.0`; prompt index pointer `29-next-task.md`; latest prompt selected Plan 06 instead of the active `.lovable/plan.md` repair plan.
- **After:** package + README pin `1.49.0`; changelog has a `1.49.0` release-note entry; prompt index pointer is `30-next-task.md`; prompt 30 names the active repair plan and the exact files/functions/lines read.

## Version + housekeeping done this turn

- `package.json` → `1.49.0`
- `README.md` pinned to `1.49.0`
- `CHANGELOG.md` adds `1.49.0` release notes
- `.lovable/prompts/index.md` latest pointer → `30-next-task.md`
- Saved this prompt as `.lovable/prompts/30-next-task.md`