# 56 — Next Task v5 (Plan 06 Phase C Step 28 bottom dot pagination ellipsis wiring)

## Files, functions, and signals read before selecting work

- `.lovable/coding-guidelines.md:1-22` — code rules apply; tests use `bunx vitest run`, errors must not be swallowed, slide code should use existing tokens.
- Project memory index and always-on memory — slide URLs are 1-based, default transition is fade, step-aware slides use `slideStepCount(slide)`, and animated surfaces use `useReducedMotion()`.
- Dev-server logs — no actionable runtime stack trace; latest signal was Vite ready/connected plus historical restart exits with code 143.
- `.lovable/prompts/55-next-task.md:24-39` — the next three named tasks were DotPagination wiring, SlideIndicator wiring, and threshold control.
- `spec/old-slides/27-slides-number/14-ellipsis-pagination.md:57-78` — rendering contract: number slots render as today, ellipses are buttons with `Slides X to Y` labels, active layout target stays on number slots only, snapshot/rendered tests lock `20/current 10`.
- `src/components/slides/controls/pagination.ts:1-38` — verified `buildPaginationSlots(current, total, threshold, neighbors=2)` slot builder.
- `src/components/slides/controls/DotPagination.tsx:21-115` before fix — rendered `Array.from({ length: total }, ...)`, so the pure builder was dead code for the bottom controller.
- `src/components/slides/controls/DotPagination.test.tsx:15-49` before fix — existing keyboard-only coverage lacked a rendered long-deck compaction assertion.
- `src/components/slides/controls/SlideIndicator.tsx:24-149` — top controller remains a jump input and does not yet consume pagination slots.
- `src/components/slides/SettingsDrawer.tsx:86-92` and spec `15-ellipsis-threshold-setting.md:34-67` — settings work remains pending; no `ellipsisThreshold` read path exists yet.

## Root cause

`DotPagination.tsx:53` ignored the verified `buildPaginationSlots()` module and still mapped `1..total`, so decks above the threshold rendered every slide instead of ellipsis slots.

## Minimum correct fix for this request

Add a failing rendered-slot regression, replace the raw number loop with `buildPaginationSlots(current, total, 15)`, render ellipsis slots as inert range-labelled buttons, then update release metadata and the next-task registry.

## Next 3 Steps — exactly 3

### Step 1 — Wire `buildPaginationSlots` into `SlideIndicator.tsx`
- **Reasoning:** `SlideIndicator.tsx:24-149` still exposes only the current/total jump input, while the spec applies ellipsis pagination to both top and bottom surfaces. If skipped, users get compact pagination in the bottom strip but not the controller pill, creating divergent navigation behaviours.
- **Time estimate:** ~50 min.
- **What it unblocks:** Shared ellipsis labels/keyboard order across controller surfaces and a single path for the future range-scoped jump popover.

### Step 2 — Add `riseup.controller.ellipsisThreshold` persistence and SettingsDrawer control
- **Reasoning:** `DotPagination.tsx` currently uses the default `15` constant because the threshold read/write path does not exist. If skipped, the feature works only at a hardcoded density and cannot satisfy the user-configurable threshold spec.
- **Time estimate:** ~60 min.
- **What it unblocks:** User-controlled compaction, persistence tests, and passing threshold values into both `DotPagination` and `SlideIndicator` without renderer-level clamping.

### Step 3 — Add the `GoToInput` ellipsis popover
- **Reasoning:** Ellipsis buttons now expose collapsed ranges but do not yet open a range-scoped jump UI. If skipped, the ellipsis is accessible as a range marker but incomplete as an interaction affordance.
- **Time estimate:** ~70 min.
- **What it unblocks:** Full command 06 click-`…` behaviour and the 25-slide e2e flow.

## Every remaining item after those 3

- Phase A Step 8 remainder: stubs for `steps`, `timeline`, media (`image`, `image-grid`, `image-compare`, `video`, `embed`, `code`, `terminal`), data/diagrams, structure, interactive, and comparison/decision types.
- Phase A Steps 9–20: theme catalog addendum, sample-image palette mapping, LLM-guideline outline, Teams JSON shape, schema/media unions, variety guard, launcher download affordance, docs mirror mechanism, coverage expectations, memory update, and Phase A gap check.
- Phase B Steps 21–25: Ubuntu heading CSS/font implementation, title-surface audit, computed-style regression, and visual verification.
- Phase C Step 32 after the next 3: deck-with-25-slides e2e coverage for both controller surfaces and the ellipsis popover.
- Phase D Steps 33–67: shared slide-type primitives plus all 35 renderer/docs/sample entries.
- Phase E Steps 68–77: new sample/theme palettes, theme enum/docs updates, picker grouping, and round-trip tests.
- Phase F Steps 78–92: LLM guide rewrite, sample deck rebuild, public docs mirror, launcher downloads, guide validation, and contributor docs.
- Phase G Steps 93–100: build/test/visual QA, memory updates, move Plan 06 to completed, and post-mortem.
- Plan 05 carry-over: live-repro `spec/issues/002-step-transition-black-flash.md` at `/slides/4/2 → /slides/4/3` remains needs-live-repro before closure.

## Verification

- **Before:** Added `DotPagination.test.tsx` long-deck assertion for `total=20,current=10`; `bunx vitest run src/components/slides/controls/DotPagination.test.tsx` failed because buttons rendered all `1..20` instead of `1 … 8 9 10 11 12 … 20`.
- **After:** `DotPagination.tsx` renders slots from `buildPaginationSlots`; `bunx vitest run src/components/slides/controls/DotPagination.test.tsx src/components/slides/controls/pagination.test.ts` passes 12/12. `package.json` and `README.md` pin `1.75.0`; `CHANGELOG.md` has the 1.75.0 entry; prompt registry points to `56-next-task.md`.