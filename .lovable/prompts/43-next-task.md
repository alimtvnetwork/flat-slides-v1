# 42 — Next Task v5 (triage; step 2 needs live repro)

## Files, functions, and signals read before selecting work

- `.lovable/coding-guidelines.md:1-18` — coding rules apply; `.lovable/coding-guidelines.md` exists, `spec/coding-guidelines/` has no files, and `.lovable/seo-guidelines.md` is absent.
- `.lovable/memory/index.md:5-29` — active workflow, diagnostics, no-default-camera-zoom, no-highlight-glow, presenter-controller, and inspector memory entries.
- `.lovable/plan.md:13-33` — active 10-step repair plan; unresolved work starts with fullscreen persistence, slide-4 step animation, then visual-rule regression coverage.
- `.lovable/strictly-avoid.md:3-7` — no default camera zoom, no `.hl` glow/blur, no direct `mem://` writes, no route tree edits, and no hardcoded component colors.
- `src/components/slides/useSlideNavigation.ts:43-75` — `goTo()` only virtualizes route changes when native `document.fullscreenElement` exists; app-presentation mode without native fullscreen still falls through to router navigation.
- `src/components/slides/useSlideNavigation.ts:85-90` — `prev()` still routes through `goTo()` and has compressed multi-statement logic that should be cleaned if touched during the fullscreen persistence fix.
- `src/components/slides/RenderSlide.tsx:236-265` — `StepDetailPane` owns displayed/exiting step state and is the first real trace point for the slide-4 step 2→3 black-frame failure.
- `src/components/slides/RenderSlide.tsx:268-323` — `StepsSlide` applies step phase opacity/blur/active-state styles and mounts `StepDetailPane` inside a persistent right-side pane.
- `src/styles.css:170-278` — slide defaults already set true-white `--slide-fg`; `.hl` has the exact crisp shadow, while `.hl-pill` still has `box-shadow` that must be audited against the no-glow rule.
- `spec/issues/README.md:6-40` — issue tracking still has open fullscreen/presenter-window related items and must only be updated after behavior is validated.
- Dev-server logs — before signal: Vite repeatedly starts cleanly (`VITE v7.3.2 ready`) with no actionable runtime stack trace; only restart exit code `143` entries are present.

## Root cause

The repeated request is a next-task artifact/version refresh request with no new runtime stack trace, while the latest registry still points to `34-next-task.md` and package/README are pinned at `1.53.0`.

## Minimum correct fix for this request

Create this fresh prompt artifact, preserve the evidence-backed next 3 repair steps, bump the minor version, add the release-note entry, and pin the new version in the root README.

## Next 3 Steps — exactly 3

### Step 1 — Reproduce and repair fullscreen persistence across navigation
- **Reasoning:** `.lovable/plan.md:15-19` makes fullscreen persistence the first active repair, and `useSlideNavigation.ts:43-75` shows route virtualization only happens under native `document.fullscreenElement`. If skipped, app-presentation mode can still remount or exit on slide advance, making every later presenter verification unreliable.
- **Time estimate:** ~70 min.
- **What it unblocks:** A stable presenter/fullscreen shell for validating step transitions, controller state, Settings, and visual rules across slide navigation.

### Step 2 — Reproduce and repair slide-4 step 2→3 black-frame transition
- **Reasoning:** `.lovable/plan.md:21-25` names the slide-4 step transition as the second active failure, and `RenderSlide.tsx:236-323` shows the detail pane and step list already own focused-step rendering. If skipped, `steps` and `timeline` slides remain visually unreliable even if fullscreen persistence is fixed.
- **Time estimate:** ~65 min.
- **What it unblocks:** Smooth step-aware navigation under the fade/no-zoom motion contract and focused regression coverage for step transitions.

### Step 3 — Lock visual rules and regression coverage
- **Reasoning:** `.lovable/plan.md:27-33` requires true-white default text, exact highlight shadow, and tests; `src/styles.css:170-278` confirms the current audit points are `--slide-fg`, `.hl`, and `.hl-pill`. If skipped, visual regressions can reappear and pending issues cannot be closed honestly.
- **Time estimate:** ~60 min.
- **What it unblocks:** Verified closure of the active repair plan and safe return to Plan 06 slide-types/themes/controller work.

## Every remaining item after those 3

- `.lovable/plan.md` steps 9-10: focused regression tests and issue-tracker updates for fullscreen persistence, embedded-preview fallback, slide-4 no-black-frame behavior, step-state emphasis, default white foreground, and `.hl` no-glow enforcement.
- `spec/issues/001-preview-iframe-fullscreen.md`, `spec/issues/002-step-transition-black-flash.md`, `spec/issues/README.md`, and `.lovable/pending-issues/index.md`: update only after the corresponding behavior is actually validated.
- Open issues still visible in `spec/issues/README.md:19-39`: `012-node-build-deck-script-missing`, `014-preview-fullscreen-breaks-out-of-iframe`, `022-deck-music-autoplay-blocked-without-gesture`, and `031-node-render-script-missing`.
- Plan 06 Phases A-G in `.lovable/plans/pending/06-slide-types-themes-llm-controller.md`: 35 new slide types, new themes, controller ellipsis/white-balance work, LLM guideline rewrite, launcher download, and final close-out remain pending until this repair plan closes.

## Verification

- **Before:** Dev-server logs had no actionable stack trace; latest prompt pointer was `34-next-task.md`; package/README version was `1.53.0`.
- **After:** Confirm prompt registry points to `35-next-task.md`, package/README pin `1.54.0`, and changelog contains the `1.54.0` planning/release-note entry.