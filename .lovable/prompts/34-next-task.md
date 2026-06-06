# 34 — Next Task v5 (repeat-request version refresh)

## Files, functions, and signals read before selecting work

- `.lovable/coding-guidelines.md:1-18` — coding rules apply; `spec/coding-guidelines/` absent; `.lovable/seo-guidelines.md` absent.
- `.lovable/memory/index.md:5-29` — active workflow, diagnostics, no-default-camera-zoom, no-highlight-glow, presenter-controller and inspector memory entries.
- `.lovable/plan.md:13-33` — active 10-step repair plan; first unresolved items are fullscreen persistence, slide-4 step animation, visual-rule regression coverage.
- `.lovable/strictly-avoid.md:1-7` and `.lovable/memory/avoid/02-no-hl-glow.md:1-5` — no camera-zoom default, no glow/blur on `.hl`, no hardcoded component colors.
- `src/components/slides/useSlideNavigation.ts:43-75` — `goTo()` only virtualizes URL changes when native `document.fullscreenElement` exists.
- `src/components/slides/useSlideNavigation.ts:78-90` — `next()` and `prev()` route through `goTo()`; `prev()` still has compressed multi-statement logic that needs cleanup when touched.
- `src/components/slides/RenderSlide.tsx:236-260` — `StepDetailPane` owns displayed/exiting state for step detail swaps and must be the first step-transition trace point.
- `src/styles.css:244-269` — `.hl` has the exact crisp shadow, but `.hl-pill` still carries box-shadow treatment that must be audited against the no-glow rule.
- Dev-server logs — before signal: Vite starts cleanly (`VITE v7.3.2 ready`) and no actionable runtime stack trace is present.

## Root cause

The only current failure signal is a repeated next-task request with no actionable Vite stack trace, so the defect is stale planning/version metadata rather than a product runtime error.

## Minimum correct fix for this request

Create this fresh prompt artifact, keep the same evidence-backed next 3 repair steps, bump the minor version, add changelog/release-note metadata, and pin the new version in the root README.

## Next 3 Steps — exactly 3

### Step 1 — Reproduce and repair fullscreen persistence across navigation
- **Reasoning:** `.lovable/plan.md:15-19` names fullscreen persistence as the first active failure, and `useSlideNavigation.ts:54-57` only dispatches the in-place fullscreen URL event when native fullscreen exists. If skipped, app-presentation mode can still remount/exit on slide advance and every later presenter fix is tested on an unstable shell.
- **Time estimate:** ~70 min.
- **What it unblocks:** A stable presenter/fullscreen surface for validating step animations, controller state, Settings, and visual rules across slide navigation.

### Step 2 — Reproduce and repair slide-4 step 2→3 black-frame transition
- **Reasoning:** `.lovable/plan.md:21-25` names the slide-4 step transition as the second active failure, and `RenderSlide.tsx:236-260` shows the detail pane already uses persistent state, so the remaining black frame must be traced through keys/background/remount rather than patched with a fallback. If skipped, step-aware slides remain visually unreliable even after fullscreen is stable.
- **Time estimate:** ~65 min.
- **What it unblocks:** Smooth `steps`/`timeline` navigation under the fade/no-zoom motion contract and reliable regression coverage for step transitions.

### Step 3 — Lock visual rules and regression coverage
- **Reasoning:** `.lovable/plan.md:27-33` requires true-white default text, exact highlight shadow, and focused tests; `src/styles.css:244-269` confirms `.hl` is correct but `.hl-pill` still has a box-shadow path to audit/remove if it violates the no-glow rule. If skipped, the same visual regressions can reappear and pending issues cannot be closed honestly.
- **Time estimate:** ~60 min.
- **What it unblocks:** Verified closure of the active repair plan and safe return to Plan 06 slide-types/themes/controller work.

## Every remaining item after those 3

- `.lovable/plan.md` steps 9-10: focused regression tests and issue-tracker updates for fullscreen persistence, embedded-preview fallback, slide-4 no-black-frame behavior, step-state emphasis, default white foreground, and `.hl` no-glow enforcement.
- `spec/issues/001-preview-iframe-fullscreen.md`, `spec/issues/002-step-transition-black-flash.md`, `spec/issues/README.md`, and `.lovable/pending-issues/index.md`: update only after the corresponding behavior is actually validated.
- Plan 06 Phases A-G in `.lovable/plans/pending/06-slide-types-themes-llm-controller.md`: 35 new slide types, new themes, controller ellipsis/white-balance work, LLM guideline rewrite, launcher download, and final close-out remain pending until this repair plan closes.

## Verification

- **Before:** Dev-server logs had no actionable stack trace; latest prompt pointer was `33-next-task.md`; package/README version was `1.52.0`.
- **After:** Confirm prompt registry points to `34-next-task.md`, package/README pin `1.53.0`, and changelog contains the `1.53.0` planning entry.