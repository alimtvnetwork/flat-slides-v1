# 55 — Next Task v5 (Plan 06 Phase A Step 8 first per-type stub batch)

## Files, functions, and signals read before selecting work

- `.lovable/coding-guidelines.md:1-22` — coding rules apply; errors must not be swallowed, tests use `bunx vitest run`, and slide code must use `src/styles.css` tokens.
- Project memory index (`.lovable/memory/index.md:1-30`) plus always-on memory — slide URLs are 1-based, default slide transition is fade, step-aware slides use `slideStepCount(slide)`, and animated slide surfaces must use `useReducedMotion()`.
- Dev-server logs — no actionable app stack trace; latest signal was Vite ready plus repeated historical exits with code 143, so the concrete failure was registry/spec drift rather than a runtime exception.
- `.lovable/prompts/index.md:3` — latest prompt pointed to `54-next-task.md` and claimed Step 8 was done.
- `.lovable/prompts/54-next-task.md:1-53` — file content was copied from Prompt 53 and still described the pagination slot builder / `1.72.0`, not the Step 8 theme-hooks task registered in the index.
- `.lovable/plans/pending/06-slide-types-themes-llm-controller.md:100-123` — Phase A Step 8 requires per-type stub files and Step 20 requires a gap check before implementation begins.
- `spec/old-slides/26-slide-definitions/00-catalog.md:43-54` — per-type stubs must use eight sections: purpose, content schema, layout, theme hooks, step behaviour, sample, a11y/reduced-motion, test fixture.
- `spec/old-slides/26-slide-definitions/01-theme-hooks.md:30-113` — shared and Group A channel surface consumed by the first text-first stubs.
- `src/components/slides/types.ts:95-151` — current `LeftSlideProps`, `CenterSlideProps`, `QuoteSlideProps`, and `BulletsSlideProps` root-field shapes.
- `src/components/slides/RenderSlide.tsx:104-171` and `516-572` — current renderers/layouts for `left`, `center`, `quote`, and `bullets`.

## Root cause

`54-next-task.md` was registered as the latest Step 8 handoff, but it still contained Prompt 53's stale pagination text while the first required per-type stubs (`02-left.md` through `05-bullets.md`) were absent.

## Minimum correct fix for this request

Create the first low-risk per-type stub batch using the exact catalog template and theme-hook surface, then register a fresh coherent prompt, bump the minor version, update release notes, and record the plan note.

## Next 3 Steps — exactly 3

### Step 1 — Wire `buildPaginationSlots` into `DotPagination.tsx`
- **Reasoning:** `src/components/slides/controls/pagination.ts` is implemented and tested, but `DotPagination.tsx` still renders one dot per slide, so long decks still overwhelm the bottom controller. If skipped, the verified slot builder remains dead code and command 06's ellipsis behavior is not user-facing.
- **Time estimate:** ~55 min.
- **What it unblocks:** Visible long-deck ellipses, shared slot rendering patterns, and the later 25-slide e2e test.

### Step 2 — Wire `buildPaginationSlots` into `SlideIndicator.tsx`
- **Reasoning:** The top-right indicator/jump control must share the same slot model as the bottom controller or the app will expose two inconsistent pagination behaviours. If skipped, users see ellipses in only one controller and the popover scoping work will split into two paths.
- **Time estimate:** ~45 min.
- **What it unblocks:** A single ellipsis click model for `GoToInput`, shared a11y labels, and consistent threshold behaviour.

### Step 3 — Add the ellipsis threshold control to `SettingsDrawer.tsx`
- **Reasoning:** The spec requires `controller.ellipsisThreshold` to be configurable with default 15; without the setting, the threshold is hardcoded and cannot satisfy user/deck preferences. If skipped, the UI cannot persist or validate threshold changes.
- **Time estimate:** ~40 min.
- **What it unblocks:** Persistence tests for `riseup.controller.ellipsisThreshold`, user-configurable long-deck density, and the final 25-slide e2e coverage.

## Every remaining item after those 3

- Phase A Step 8 remainder: stubs for `steps`, `timeline`, media (`image`, `image-grid`, `image-compare`, `video`, `embed`, `code`, `terminal`), data/diagrams, structure, interactive, and comparison/decision types.
- Phase A Steps 9–20: theme catalog addendum, sample-image palette mapping, LLM-guideline outline, Teams JSON shape, schema/media unions, variety guard, launcher download affordance, docs mirror mechanism, coverage expectations, memory update, and Phase A gap check.
- Phase B Steps 21–25: Ubuntu heading CSS/font implementation, title-surface audit, computed-style regression, and visual verification.
- Phase C Steps 30–32 after the next 3: `GoToInput` popover midpoint focus and 25-slide e2e test.
- Phase D Steps 33–67: shared slide-type primitives plus all 35 renderer/docs/sample entries.
- Phase E Steps 68–77: new sample/theme palettes, theme enum/docs updates, picker grouping, and round-trip tests.
- Phase F Steps 78–92: LLM guide rewrite, sample deck rebuild, public docs mirror, launcher downloads, guide validation, and contributor docs.
- Phase G Steps 93–100: build/test/visual QA, memory updates, move Plan 06 to completed, and post-mortem.
- Plan 05 carry-over: live-repro `spec/issues/002-step-transition-black-flash.md` at `/slides/4/2 → /slides/4/3` remains needs-live-repro before closure.

## Verification

- **Before:** `ls spec/old-slides/26-slide-definitions` showed only `00-catalog.md` and `01-theme-hooks.md`; `.lovable/prompts/54-next-task.md:1` still said `# 53` and its verification section still pinned `1.72.0`.
- **After:** `02-left.md`, `03-center.md`, `04-quote.md`, and `05-bullets.md` exist and each follows the required eight-section stub template; `package.json` and `README.md` pin `1.74.0`; `CHANGELOG.md` has the 1.74.0 release note; `.lovable/prompts/index.md` points to this prompt.