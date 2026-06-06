# 31 — Next Task v5 (repeat-request evidence refresh)

## Files and signals read before selecting work

- `.lovable/coding-guidelines.md:1-23` — coding rules exist and apply; `spec/coding-guidelines/` and `.lovable/seo-guidelines.md` were checked and were absent.
- `.lovable/memory/index.md:1-29` — active memory confirms slide URLs are 1-based, parent slide routes must render `<Outlet />`, no default camera zoom, and no `.hl` glow.
- `.lovable/plan.md:1-42` — current active plan remains the 10-step repair pass: fullscreen persistence, slide-4 step animation, white text, highlight shadow, regression coverage, and issue tracking.
- `.lovable/prompts/30-next-task.md:1-66` — prior prompt already corrected the stale Plan 06 queue and pinned the active repair plan.
- Route declarations from `src/routes/*` were scanned with `rg -n "createFileRoute\(" src/routes`; no current dev-server route-tree mismatch stack was present in logs.
- TanStack Router file-based routing documentation was fetched to re-check the repeated-error suspicion around route IDs and layout/index files.
- Dev-server logs — no actionable runtime stack trace; only repeated `script "dev" exited with code 143` restart lines.

## Root cause

No implementation work landed after prompt 30, so this repeat next-task request needs a fresh evidence-stamped prompt/version pointer rather than changing product code or inventing a new task order.

## Next 3 Steps — exactly 3

### Step 1 — Reproduce and repair fullscreen persistence across navigation
- **Reasoning:** `.lovable/plan.md:15-19` makes fullscreen persistence the first active failure. `src/components/slides/useSlideNavigation.ts:54-57` only virtualizes route changes when native `document.fullscreenElement` exists, while app-presentation mode can still navigate directly; skipping this leaves Present mode vulnerable to remount/exit symptoms on slide advance.
- **Time:** ~70 min (15 reproduce/log, 20 trace `useFullscreen` + navigation + route shell, 20 minimum fix, 15 focused verification).
- **Unblocks:** A stable presenter shell for the step-animation and visual-rule repairs.

### Step 2 — Reproduce and repair slide-4 step 2→3 black-frame transition
- **Reasoning:** `.lovable/plan.md:21-25` names the step transition as the second live failure. `src/components/slides/RenderSlide.tsx:236-323` already has a persistent `StepDetailPane`, so the remaining work must prove whether the black frame comes from slide/step keys, background layer repaint, or route remount; skipping this risks another blind animation patch.
- **Time:** ~65 min (15 reproduce `/slides/4/2 → /slides/4/3`, 15 inspect keys/background/remounts, 20 minimum no-black-frame fix, 15 reduced-motion + test/preview verification).
- **Unblocks:** Smooth step/timeline navigation without violating the no-zoom/no-scale motion contract.

### Step 3 — Lock visual rules and regression coverage
- **Reasoning:** `.lovable/plan.md:27-33` requires true-white default text, exact highlight shadow, and regression coverage before closure. `src/styles.css:163` already sets true-white default foreground and `.hl` is correct at `src/styles.css:247-256`, but `.hl-pill` still has box-shadow at `src/styles.css:266-268`; skipping this leaves a known forbidden glow/shadow path and no guardrail.
- **Time:** ~60 min (15 style audit, 15 minimum CSS fix, 20 focused tests, 10 issue-tracking updates).
- **Unblocks:** Honest closure of the active repair plan and safe return to Plan 06.

## Remaining items after those 3

### Active repair plan in `.lovable/plan.md`
- Steps 1-3: Reproduce fullscreen failure, trace fullscreen state machine, fix fullscreen persistence — Next Step 1.
- Steps 4-6: Trace slide-4 step data, replace the black-frame transition, set step-state hierarchy — Next Step 2.
- Steps 7-8: Default white text and exact highlight/no-glow enforcement — Next Step 3.
- Step 9: Add focused regression tests for fullscreen persistence, embedded fallback, no black-frame/remount, step-state styling, default foreground, and `.hl` no glow.
- Step 10: Validate and update `spec/issues/001-preview-iframe-fullscreen.md`, `spec/issues/002-step-transition-black-flash.md`, `spec/issues/README.md`, and `.lovable/pending-issues/index.md`; leave post-publish checks pending unless actually verified.

### Plan 06 still pending after the active repair plan
- Phase A Steps 1-20: command/spec/RCA work for Ubuntu headers, ellipsis pagination, new slide-type catalog, new theme catalog, LLM guideline outline, schema/media specs, launcher docs, and memory-index updates.
- Phase B Steps 21-25: Ubuntu regression lock, including computed-style title test and visual check.
- Phase C Steps 26-32: slide-indicator ellipsis, threshold setting, go-to popover, pagination tests, and 25-slide e2e.
- Phase D Steps 33-67: shared primitives plus 35 new slide renderers.
- Phase E Steps 68-77: sample-based and additional themes, schema/docs updates, picker grouping, round-trip tests.
- Phase F Steps 78-92: LLM JSON guideline rewrite, Teams/themes/controller sections, rebuilt sample deck, public mirrors, launcher downloads.
- Phase G Steps 93-100: build/test/visual QA, preview checks, memory notes, move Plan 06 to completed, post-mortem.

## Verification for this prompt turn

- **Before:** package + README pin `1.49.0`; prompt index pointer `30-next-task.md`; latest prompt already had the active repair order.
- **After:** package + README pin `1.50.0`; changelog has a `1.50.0` release-note entry; prompt index pointer is `31-next-task.md`; prompt 31 preserves the active repair order with fresh repeated-error evidence.

## Version + housekeeping done this turn

- `package.json` → `1.50.0`
- `README.md` pinned to `1.50.0`
- `CHANGELOG.md` adds `1.50.0` release notes
- `.lovable/prompts/index.md` latest pointer → `31-next-task.md`
- Saved this prompt as `.lovable/prompts/31-next-task.md`