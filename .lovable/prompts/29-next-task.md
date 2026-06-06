# 29 — Next Task v5 (post-1.47.0)

## Files and signals read before selecting work

- `.lovable/coding-guidelines.md` — present and applies. `spec/coding-guidelines/` and `.lovable/seo-guidelines.md` absent (skipped silently).
- `.lovable/memory/index.md:1-29` — Core rules confirmed (no default camera zoom, slide URL contract, presenter controller/inspector features).
- `.lovable/plans/pending/06-slide-types-themes-llm-controller.md` — only pending plan; next unlanded work is still Steps 4, 5–6, 24.
- `.lovable/prompts/28-next-task.md:1-80` — prior next-task prompt; same 3-step ordering remains correct.
- `package.json` version `1.47.0`; `README.md:3` pinned `1.47.0`; `CHANGELOG.md` head shows 1.47.0 triage entry.
- Dev-server logs: no actionable runtime stack trace; only vite restarts and `[vite] connected`.

## Root cause

The next-task registry still pointed at prompt 28 / version 1.47.0 with no Plan 06 code work landed since; this turn re-pins the same correct 3-step order and publishes a fresh release bump so the queue and changelog stay in sync.

## Next 3 Steps — exactly 3

### Step 1 — Plan 06 Step 4: Ubuntu-everywhere typography addendum
- **Reasoning:** Ubuntu/700 for headings is not yet locked into `spec/old-slides/21-slides-system/llm/10-typography.md`. Phase D will add 35 renderers; without the addendum, new title JSX will regress the 1.44.0 hero-title fix.
- **Time:** ~45 min (10 read, 20 write addendum + anti-pattern table, 10 memory index Core line, 5 verify cross-refs).
- **Unblocks:** Safe authoring checklist for all Phase D renderers and the regression test in Step 2.

### Step 2 — Plan 06 Step 24 pulled forward: Ubuntu Bold computed-style snapshot test
- **Reasoning:** No automated guard yet proves computed `font-family` / `font-weight` on the hero `<h1>`. Without this test, Phase D's renderers can silently break the 1.44.0 fix again.
- **Time:** ~40 min (10 inspect test setup, 20 write focused Vitest+jsdom test on `RenderSlide`, 10 run focused test).
- **Unblocks:** Phase D renderer work proceeds against a locked typography invariant.

### Step 3 — Plan 06 Steps 5+6: Ellipsis-pagination spec + `riseup.controller.ellipsisThreshold`
- **Reasoning:** The visual/interaction contract for long decks is not written under `spec/old-slides/27-slides-number/03-ellipsis-pagination.md`. Implementing `buildPaginationSlots` before specifying slots/edge cases creates undocumented UI behavior.
- **Time:** ~50 min (15 examples for 8/15/30/100-slide decks, 20 behavior + edge cases, 10 threshold setting default/range, 5 cross-link SS-03).
- **Unblocks:** Phase C implementation of `buildPaginationSlots`, controller ellipsis rendering, and the white-balance-in-controller layout pass folded in from SS-02.

## Remaining items after those 3

### Plan 06 Phase A — Spec & RCA
- Steps 1–3: complete from prior reads/RCA/font audit.
- Step 4: typography addendum — Next Step 1.
- Steps 5–6: ellipsis spec + threshold — Next Step 3.
- Step 7: new-slide-types catalog at `spec/old-slides/26-slide-definitions/00-new-types-catalog.md`.
- Step 8: 35 stub spec files (one per new type).
- Step 9: themes catalog addendum to `spec/old-slides/21-slides-system/07-theme-system.md`.
- Step 10: sample-image palette mapping in `assets/icons/colors-themes/Palette.md`.
- Step 11: LLM-guideline rewrite outline `docs/slides/spec/llm-json-guideline.outline.md`.
- Step 12: Teams JSON shape for `TeamRoster` + `TeamSpotlight`.
- Step 13: schema-extension draft for new slide/theme/controller enums.
- Steps 14–20: media-source unions, variety guard, launcher download spec, docs mirror spec, test expectations, memory-index updates, Phase A gap check.

### Plan 06 Phase B — Ubuntu regression lock
- Step 21: verify/adjust root Ubuntu font link if needed.
- Step 22: audit title elements in `RenderSlide.tsx` and per-slide-type files.
- Step 23: token check `.slide-title`, `.slide-title-lg`, `.slide-subtitle`.
- Step 24: computed-style test — Next Step 2.
- Step 25: visual check vs `assets/samples/01-sample.webp` at 1920×1080.

### Plan 06 Phase C — Slide-indicator ellipsis + white-balance
- Steps 26–32: `buildPaginationSlots`, wire `SlideIndicator`/`DotPagination`, threshold setting, `…` go-to popover, unit tests, 25-slide e2e, plus SS-02 white-balance-in-controller folded in.

### Plan 06 Phase D — New slide types
- Steps 33–67: shared primitives + 35 renderers (image layouts, before/after, SVG/animated/GIF/video/Lottie, diagram/device/map, quote/team/org/FAQ/pricing/stat/KPI/comparison/roadmap/gantt/code/terminal/chart/donut/callout/CTA/agenda/chapter/end-card).

### Plan 06 Phase E — New themes
- Steps 68–77: implement `sample-*` themes from the 3 reference images + extra dark/light/accent palettes, schema/theme docs, theme picker grouping, round-trip tests.

### Plan 06 Phase F — LLM guideline rewrite + download
- Steps 78–92: rewrite the LLM JSON guide, Teams/themes/controller/transitions/validation sections, rebuild sample deck, mirror to public, launcher downloads, validate `sample-deck.json`, README/changelog/package for that release.

### Plan 06 Phase G — Verification, memory, handoff
- Steps 93–100: build/test/visual QA, preview verification, memory feature notes, memory index updates, move Plan 06 → completed, post-mortem note.

## Verification for this prompt turn

- **Before:** package + README pin `1.47.0`; prompt index pointer `28-next-task.md`.
- **After:** package + README pin `1.48.0`; changelog has `1.48.0` entry; prompt index pointer `29-next-task.md`; prompt 29 file saved.

## Version + housekeeping done this turn

- `package.json` → `1.48.0`
- `README.md` pinned to `1.48.0`
- `CHANGELOG.md` adds 1.48.0 entry
- `.lovable/prompts/index.md` latest pointer → `29-next-task.md`
- Saved this prompt as `.lovable/prompts/29-next-task.md`
