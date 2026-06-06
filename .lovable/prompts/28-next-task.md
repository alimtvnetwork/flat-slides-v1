# 28 — Next Task v5 (post-1.46.0)

## Files and signals read before selecting work

- `.lovable/coding-guidelines.md:1-23` — coding rules exist and apply; `spec/coding-guidelines/` and `.lovable/seo-guidelines.md` were checked and absent.
- `.lovable/memory/index.md:1-29` — active project memory read; relevant rules include no default camera zoom and existing presenter-controller/inspector feature notes.
- `.lovable/plans/pending/06-slide-types-themes-llm-controller.md:44-75` — Plan 06 Phase A/B source of truth; next unlanded work remains Steps 4, 5–6, and regression coverage Step 24.
- `.lovable/prompts/27-next-task.md:1-61` — previous next-task prompt read; it correctly pinned the next 3 work items but incorrectly said coding guidelines were absent.
- Dev-server logs — only recent Vite restarts with exit code 143 and current `[vite] connected`; no actionable runtime stack trace.

## Root cause

The next-task registry still points at prompt 27 / version 1.46.0, and prompt 27 contains stale guideline evidence, so this turn must republish the same correct work order with accurate read-before-work signals and a new release bump.

## Next 3 Steps — exactly 3

### Step 1 — Plan 06 Step 4: Ubuntu-everywhere typography addendum
- **Reasoning:** Issue 05 and command 05 require Ubuntu for any headers, but that rule is not yet locked into `spec/old-slides/21-slides-system/llm/10-typography.md`. The 1.44.0 code fix changed `RenderSlide.tsx` and `.slide-title-lg`, but Phase D will add 35 renderers; without the spec, new title/header JSX can regress to non-Ubuntu fonts or non-700 weights. Skipping this makes the next implementation phase repeat the same slide-1 bug.
- **Time:** ~45 minutes realistic: 10 min read the existing typography spec, 20 min write the addendum with required tokens and anti-patterns, 10 min update the project memory/index line, 5 min verify references.
- **Unblocks:** Safe authoring checklist for all new slide-type specs/renderers and the regression test in Step 2.

### Step 2 — Plan 06 Step 24 pulled forward: Ubuntu Bold computed-style snapshot test
- **Reasoning:** The actual regression was a style contract break: the title `<h1>` rendered through `.slide-title-lg`/display styling with weight 400 instead of Ubuntu Bold. There is still no automated guard proving computed `font-family` and `font-weight` on the first-slide title. Skipping this leaves the fixed bug uncovered while many new slide surfaces are about to be added.
- **Time:** ~40 minutes realistic: 10 min inspect current test setup and render helpers, 20 min write the focused Vitest/jsdom test, 10 min run the focused test and adjust only if the signal is real.
- **Unblocks:** Phase D renderer work can proceed with a locked typography invariant instead of relying on visual memory.

### Step 3 — Plan 06 Steps 5+6: Ellipsis-pagination spec + threshold setting
- **Reasoning:** Command 06 asks for ellipsis pagination when the deck is long, but the visual/interaction contract has not been written under `spec/old-slides/27-slides-number/03-ellipsis-pagination.md`. Implementing `DotPagination` or controller changes before specifying slot examples, edge cases, and `riseup.controller.ellipsisThreshold` would create another undocumented UI behavior. Skipping this blocks Phase C or forces guesswork.
- **Time:** ~50 minutes realistic: 15 min examples for 8/15/30/100-slide decks, 20 min behavior and edge-case table, 10 min threshold setting spec with default/range, 5 min cross-link against SS-03.
- **Unblocks:** Phase C implementation of `buildPaginationSlots`, controller ellipsis rendering, and the later white-balance-in-controller layout pass.

## Remaining items after those 3

### Plan 06 Phase A — Spec & RCA
- Steps 1–3: effectively complete from prior reads/RCA/font-weight audit.
- Step 4: typography addendum — covered by Next Step 1.
- Steps 5–6: ellipsis spec + threshold — covered by Next Step 3.
- Step 7: new-slide-types catalog at `spec/old-slides/26-slide-definitions/00-new-types-catalog.md`.
- Step 8: 35 stub spec files, one per new slide type.
- Step 9: themes catalog addendum to `spec/old-slides/21-slides-system/07-theme-system.md`.
- Step 10: sample-image palette mapping in `assets/icons/colors-themes/Palette.md`.
- Step 11: LLM-guideline rewrite outline at `docs/slides/spec/llm-json-guideline.outline.md`.
- Step 12: Teams JSON shape for `TeamRoster` and `TeamSpotlight`.
- Step 13: schema-extension draft for new slide/theme/controller enums.
- Steps 14–20: media-source unions, variety guard, launcher download spec, docs mirror spec, test expectations, memory-index updates, and Phase A gap check.

### Plan 06 Phase B — Ubuntu regression lock
- Step 21: verify/adjust root Ubuntu font link only if needed.
- Step 22: audit title elements in `RenderSlide.tsx` and slide type files.
- Step 23: token checks for `.slide-title`, `.slide-title-lg`, `.slide-subtitle`.
- Step 24: computed-style test — pulled forward as Next Step 2.
- Step 25: visual check against `assets/samples/01-sample.webp` at 1920×1080 fullscreen.

### Plan 06 Phase C — Slide-indicator ellipsis
- Steps 26–32: `buildPaginationSlots`, wire `SlideIndicator`/`DotPagination`, threshold setting, `…` go-to popover, unit tests, and 25-slide e2e test.

### Plan 06 Phase D — New slide types
- Steps 33–67: shared primitives plus 35 renderers/docs/samples: image layouts, before/after, SVG/animated/GIF/video/Lottie, diagram/device/map, quote/team/org/FAQ/pricing/stat/KPI/comparison/roadmap/gantt/code/terminal/chart/donut/callout/CTA/agenda/chapter/end-card.

### Plan 06 Phase E — New themes
- Steps 68–77: implement `sample-*` themes from the 3 reference images plus additional dark/light/accent palettes, schema/theme docs, theme picker grouping, and theme round-trip tests.

### Plan 06 Phase F — LLM guideline rewrite + download
- Steps 78–92: rewrite the LLM JSON guide, include Teams/themes/controller/transitions/validation sections, rebuild sample deck, mirror docs to public, add launcher downloads, validate `sample-deck.json`, update README/changelog/package for that release.

### Plan 06 Phase G — Verification, memory, handoff
- Steps 93–100: build/test/visual QA, preview verification, memory feature notes, memory index updates, move Plan 06 to completed, and write the post-mortem note.

## Verification for this prompt turn

- **Before signal:** package version and README pin were `1.46.0`, `.lovable/prompts/index.md` pointed at `27-next-task.md`, and prompt 27 line 7 incorrectly said coding guidelines were absent.
- **After signal expected:** package version and README pin are `1.47.0`, changelog has a `1.47.0` entry, prompt index points at `28-next-task.md`, and this prompt records `.lovable/coding-guidelines.md` as present.

## Version + housekeeping done this turn

- `package.json` → `1.47.0`
- `README.md` pinned to `1.47.0`
- `CHANGELOG.md` adds 1.47.0 entry
- `.lovable/prompts/index.md` latest pointer → `28-next-task.md`
- Saved this prompt as `.lovable/prompts/28-next-task.md`