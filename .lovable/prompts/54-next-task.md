# 53 — Next Task v5 (Plan 06 Phase C Step 26 pulled forward: pagination slot builder)

## Files, functions, and signals read before selecting work

- `.lovable/coding-guidelines.md:1-22` — coding rules apply; errors must not be swallowed, tests use `bunx vitest run`, and slide code must use existing design tokens.
- `.lovable/plans/pending/06-slide-types-themes-llm-controller.md:93-132` — Phase A Steps 8–20 remain mostly spec work; Phase C Step 26 defines `buildPaginationSlots` and Steps 27–32 are UI wiring/settings/e2e.
- `spec/old-slides/27-slides-number/14-ellipsis-pagination.md:20-78` — exact pure function contract, worked examples, gap-of-1 rule, ellipsis `range`, and test expectations.
- `spec/old-slides/26-slide-definitions/00-catalog.md:43-54` — per-type stub template and `01-theme-hooks.md` dependency for future stubs.
- `src/components/slides/controls/SlideIndicator.tsx:24-149` — existing top-right indicator is a jump input only; it does not yet consume pagination slots.
- `src/components/slides/controls/DotPagination.tsx:21-115` — existing bottom pagination maps `1..total` directly and is the future consumer of the shared slot builder.
- `src/components/slides/controls/DotPagination.test.tsx:15-49` — existing keyboard tests establish co-located Vitest style for controls.
- Dev-server logs — no actionable app stack trace; only repeated Vite restart exits with code 143, so this turn used isolated unit-test output as the relevant error signal.

## Root cause

The next-task registry was stale/inconsistent because `52-next-task.md` said Plan 06 Step 7 had landed but still listed older Step 5–7 next steps, while the real next actionable implementation dependency was the missing shared `buildPaginationSlots` module specified by `14-ellipsis-pagination.md`.

## Minimum correct fix for this request

Add the shared pure pagination slot builder and its co-located unit tests, fix the one off-by-one gap bug exposed by the first failing test run, then bump the minor version, changelog, README pin, plan context, and prompt registry.

## Next 3 Steps — exactly 3

### Step 1 — Draft `01-theme-hooks.md`
- **Reasoning:** `00-catalog.md:35` makes theme hooks a required field for every per-type stub, and `00-catalog.md:142` points to `01-theme-hooks.md`, which does not exist yet. If skipped, the 35 stub files will either invent their own CSS variable channels or omit the required theme contract.
- **Time estimate:** ~40 min.
- **What it unblocks:** Consistent per-type stub specs and Phase E theme palette implementation.

### Step 2 — Draft the first per-type stub batch: `02-left.md`, `03-center.md`, `04-quote.md`, `05-bullets.md`
- **Reasoning:** These preserved text-first slide types validate the stub template on low-risk existing surfaces before media/data-heavy types are specified. If skipped, the project jumps from catalog to implementation without proving the schema/layout/a11y template works.
- **Time estimate:** ~50 min.
- **What it unblocks:** The remaining Phase A Step 8 stub batches and later renderer/schema parity checks.

### Step 3 — Wire `buildPaginationSlots` into `DotPagination.tsx`
- **Reasoning:** The pure builder is now verified, but `DotPagination.tsx:53` still renders `Array.from({ length: total })`, so long decks still show every slide. If skipped, the slot builder remains dead code and command 06's visible ellipsis behavior is not user-facing.
- **Time estimate:** ~55 min.
- **What it unblocks:** Shared ellipsis rendering for `SlideIndicator`, threshold settings, GoToInput popover scoping, and the 25-slide e2e test.

## Every remaining item after those 3

- Phase A Steps 8–20: finish all per-type stub specs, theme catalog addendum, sample-image palette mapping, LLM-guideline outline, Teams JSON shape, schema/media unions, variety guard, launcher download affordance, docs mirror mechanism, coverage expectations, memory update, and Phase A gap check.
- Phase B Steps 21–25: implement the minimum Ubuntu heading CSS/font fix, audit title surfaces, add computed-style regression coverage, and visually verify slide 1 title.
- Phase C Steps 27–32: wire `SlideIndicator`, add threshold UI, add `GoToInput`, and e2e-test long-deck ellipsis behavior. Step 26 is landed early in `pagination.ts` and `pagination.test.ts`.
- Phase D Steps 33–67: shared slide-type primitives plus all 35 renderer/docs/sample entries.
- Phase E Steps 68–77: implement new sample/theme palettes, update theme enums/docs, and round-trip test themes.
- Phase F Steps 78–92: rewrite LLM guide, rebuild sample deck, mirror docs to public downloads, add launcher download buttons, validate sample deck, and update contributor docs.
- Phase G Steps 93–100: verification suites, visual QA, memory updates, move Plan 06 to completed, and post-mortem.
- Plan 05 carry-over: live-repro `spec/issues/002-step-transition-black-flash.md` at `/slides/4/2 → /slides/4/3` remains needs-live-repro before closure.

## Verification

- **Before:** `src/components/slides/controls/pagination.ts` did not exist; adding the test first produced `TS2307 Cannot find module './pagination'`. After adding the first implementation, `bunx vitest run src/components/slides/controls/pagination.test.ts` failed 7/8 because adjacent visible numbers emitted bogus ellipses with invalid ranges.
- **After:** `collapsedSlot()` returns no slot when `start > end`; `bunx vitest run src/components/slides/controls/pagination.test.ts` passes 8/8. `package.json` and `README.md` pin `1.72.0`; `CHANGELOG.md` has the 1.72.0 entry; prompt registry points to `53-next-task.md`.