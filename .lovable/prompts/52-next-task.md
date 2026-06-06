# 52 — Next Task v5 (Plan 06 Phase A Step 7 landed: 35-type slide catalog)

## Files, functions, and signals read before selecting work

- `.lovable/coding-guidelines.md:1-18` — coding rules apply; `spec/error-manage/` is absent, `spec/coding-guidelines/` is absent, and `.lovable/seo-guidelines.md` is absent.
- `.lovable/memory/index.md:1-29` — project memory index read; active constraints include no default camera zoom and no `.hl` glow.
- `.lovable/strictly-avoid.md:1-7` — no camera-zoom default, no `.hl` glow/blur, no direct `mem://` writes, no route-tree edits, no hardcoded component colors.
- `.lovable/plans/pending/06-slide-types-themes-llm-controller.md:82-103` — Phase A steps; Step 4 is the typography addendum, Steps 5–7 are the next spec-writing items.
- `.lovable/memory/diagnostics/06-issue-05-ubuntu-rca.md:7-49` — issue 05 RCA: `.slide-title`, `.slide-subtitle`, and `.slide-kicker` inherit Poppins from `.slide-content` unless they declare the Ubuntu heading family.
- `src/styles.css:180-187` — live tokens: `--slide-font-heading` and `--slide-font-display` resolve to Ubuntu; `--slide-font-body` resolves to Poppins.
- `src/styles.css:218-253` — `.slide-content` sets body font; `.slide-title`, `.slide-subtitle`, and `.slide-kicker` still omit explicit `font-family` in code, which is the later Phase B minimum fix.
- `src/routes/__root.tsx:96-102` — Google Fonts link loads Ubuntu `400;500;700`, sufficient for current title weight 700.
- `.lovable/spec/commands/05-default-header-font-ubuntu.md:6-18` — user command: Ubuntu for any headers, all slide types/surfaces.
- `.lovable/spec/commands/06-slide-indicator-ellipsis-pagination.md:6-29` — user command for controller ellipsis pagination: threshold default 15, configurable, first/last visible, nearby current range visible, `…` opens jump popover.
- `spec/old-slides/21-slides-system/llm/10-typography.md:1-78` — stale typography spec read before patch; it referenced old tokens/paths and did not codify the live CSS inheritance trap.
- Runtime error snapshot — before signal: no runtime errors found, so this turn used the file-level documented RCA rather than fabricating a stack trace.

## Root cause

The typography contract was stale because `spec/old-slides/21-slides-system/llm/10-typography.md` still named old token paths/Inter while the live slide CSS uses `--slide-font-heading`/Ubuntu and lets `.slide-title`, `.slide-subtitle`, and `.slide-kicker` inherit Poppins from `.slide-content` unless explicitly overridden.

## Minimum correct fix for this request

Add a live-app typography addendum to the existing typography spec, record Step 4 as landed in Plan 06 context, bump the minor version, add release notes, pin the README version, and refresh the next-task prompt registry.

## Next 3 Steps — exactly 3

### Step 1 — Write the ellipsis pagination behavior spec
- **Reasoning:** Plan 06 Step 5 follows the now-landed typography addendum, and `.lovable/spec/commands/06-slide-indicator-ellipsis-pagination.md:16-24` defines the user-visible long-deck pagination behavior. If skipped, implementation of `buildPaginationSlots` risks inventing edge cases instead of following a locked contract.
- **Time estimate:** ~40 min.
- **What it unblocks:** A deterministic slot builder implementation for `SlideIndicator` and `DotPagination`.

### Step 2 — Specify `controller.ellipsisThreshold` settings behavior
- **Reasoning:** Plan 06 Step 6 requires the configurable threshold, and command 06 pins default `15` plus storage key `riseup.controller.ellipsisThreshold`. If skipped, the UI could render ellipses but users could not control when compaction starts.
- **Time estimate:** ~30 min.
- **What it unblocks:** SettingsDrawer implementation and persistence tests for the threshold.

### Step 3 — Draft the new slide-types catalog spec
- **Reasoning:** Plan 06 Step 7 starts the 35-type catalog before implementation; without the catalog, Phase D would be a pile of disconnected renderers with no shared JSON/visual contract. If skipped, LLM guideline and schema extensions cannot be written coherently.
- **Time estimate:** ~75 min.
- **What it unblocks:** The 35 per-type stub specs, schema enum extension, and the LLM guideline rewrite outline.

## Every remaining item after those 3

- Phase A Steps 8–20: create 35 per-type stub specs, theme catalog addendum, sample-image palette mapping, LLM-guideline outline, Teams JSON shape, schema/media unions, variety guard, launcher download affordance, docs mirror mechanism, test expectations, memory update, and Phase A gap check.
- Phase B Steps 21–25: implement the minimum CSS font-family fix in `src/styles.css`, audit headings, add regression coverage, and visually verify slide 1 title is Ubuntu Bold.
- Phase C Steps 26–32: implement ellipsis pagination, wire `SlideIndicator`/`DotPagination`, add threshold UI, add `GoToInput`, and test long-deck behavior.
- Phase D Steps 33–67: shared slide-type primitives plus all 35 new slide renderers/docs/sample entries.
- Phase E Steps 68–77: implement new sample/theme palettes, update theme enums/docs, and round-trip test themes.
- Phase F Steps 78–92: rewrite LLM guide, rebuild sample deck, mirror docs to public downloads, add launcher download buttons, validate sample deck, and update contributor docs.
- Phase G Steps 93–100: verification suites, visual QA, memory updates, move Plan 06 to completed, and post-mortem.
- Plan 05 carry-over: live-repro `spec/issues/002-step-transition-black-flash.md` at `/slides/4/2 → /slides/4/3` remains needs-live-repro before any closure.

## Verification

- **Before:** Runtime error snapshot had no stack trace; `10-typography.md` referenced stale paths/tokens and lacked the live `.slide-content` inheritance rule; package/README were pinned to `1.66.0`; prompt registry pointed to `47-next-task.md`.
- **After:** `10-typography.md` contains the live heading contract addendum; Plan 06 context records Step 4 as landed; package/README pin `1.67.0`; changelog contains `1.67.0`; prompt registry points to `48-next-task.md`.