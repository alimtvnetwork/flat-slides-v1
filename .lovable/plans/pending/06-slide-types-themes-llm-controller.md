# Slide types, themes, LLM guideline, controller ellipsis (100 steps)

**Slug:** slide-types-themes-llm-controller
**Steps:** 100
**Status:** pending
**Created:** 2026-06-06

## Context

The user is consolidating four asks into one large body of work:

1. Fix the regression where the first slide's title does not render in
   Ubuntu (issue 05) — the standing rule is "Ubuntu for any headers"
   (command 05).
2. Add many new slide types covering image, SVG, GIF, video, Lottie,
   team, comparison, code, chart, etc. (command 07 implicit).
3. Add new theme palettes seeded from the reference images at
   `assets/samples/01-sample.webp`, `02-sample.webp`, `03-sample.jpg`
   (command 08).
4. Update the slide-number controller to use ellipsis pagination when a
   deck exceeds a configurable threshold (default 15) (command 06).
5. Rewrite `docs/slides/spec/llm-json-guideline.md` so any LLM can author
   a deck from JSON alone — including a Teams section — and expose it as
   a downloadable file in the launcher (command 07).

Captured input files:
- Issue: `.lovable/issues/05-first-slide-not-ubuntu.md`
- Commands: `.lovable/spec/commands/05-default-header-font-ubuntu.md`,
  `06-slide-indicator-ellipsis-pagination.md`,
  `07-llm-guideline-must-include-teams-and-be-downloadable.md`,
  `08-sample-images-as-theme-source.md`.
- Reference images: `assets/samples/01-sample.webp`,
  `02-sample.webp`, `03-sample.jpg`.

The user's structural directive: spend the first ~20 steps writing
spec/docs, then ~80 steps implementing. That cadence is preserved below.

### Phase A — Step 1 kickoff notes (2026-06-06)

All four captured command files (`05-default-header-font-ubuntu.md`,
`06-slide-indicator-ellipsis-pagination.md`,
`07-llm-guideline-must-include-teams-and-be-downloadable.md`,
`08-sample-images-as-theme-source.md`), issue 05, the three sample
images, and the four SS-0x subtask files have all been read and
confirmed present on disk. Scope matches Context items 1–5 above; no
in-scope work is missing from the inputs.

**Open questions surfaced while reading — resolve before Step 4:**

1. **Themes registry path.** Command 08 names `src/slides/themes.ts`,
   but the actual file is `src/components/slides/themes.ts` (with
   tests at `themes.test.ts` and `theme-persistence.test.ts`). Step 9
   spec must use the real path.
2. **SettingsDrawer location.** Command 06 implies
   `src/components/slides/controls/SettingsDrawer.tsx`, but the file
   actually lives at `src/components/slides/SettingsDrawer.tsx`.
   Steps 6 and 26–32 must reference the real path.
3. **GoToInput component.** Command 06 says "reuse existing
   `GoToInput`"; no file by that name exists yet. Decide in Step 5
   whether to extract it from `SlideIndicator.tsx`/`DotPagination.tsx`
   or author a new component.
4. **`public/docs/` mirror mechanism.** Step 17 specifies the
   `docs/slides/spec/*` → `public/docs/*` mirror but not the
   technology. Default to a `prebuild` npm script (cross-platform
   `cp`) unless a vite plugin is already in use; decide before
   Phase F.
5. **Issue 05 RCA — CSS vs HTML root cause.** Hypothesis to confirm
   in Step 2: title slide variant in `src/components/slides/types/`
   renders its `<h1>` without inheriting `var(--font-display)`
   because the type-local class overrides `font-family`. Confirm by
   computing `font-family` on `/slides/1` title before writing the
   addendum in Step 4.

Subtask files (depth-heavy steps link into these):
- `./subtasks/06-slide-types-themes-llm-controller/SS-01-new-slide-types-catalog.md`
- `./subtasks/06-slide-types-themes-llm-controller/SS-02-new-themes-catalog.md`
- `./subtasks/06-slide-types-themes-llm-controller/SS-03-controller-ellipsis.md`
- `./subtasks/06-slide-types-themes-llm-controller/SS-04-llm-guideline-rewrite.md`

## Steps

### Phase A — Spec & RCA (Steps 1–20)

1. Read all four captured command files end-to-end and confirm scope; record any open questions in this plan's Context before writing further specs.
2. RCA the Ubuntu regression: open `src/components/slides/RenderSlide.tsx`, every title slide type in `src/components/slides/types/`, and `src/styles.css`; identify why slide 1's title falls back. Record findings under `.lovable/memory/diagnostics/`.
3. Confirm `src/routes/__root.tsx` loads Ubuntu at weights `400;500;700` (and `400i;700i` if needed); record the gap.
4. Author the spec for the Ubuntu-everywhere rule as `spec/old-slides/21-slides-system/llm/10-typography.md` addendum (or new sibling) — every header element MUST resolve to `var(--font-display)` and Ubuntu Bold for titles.
5. Write spec doc `spec/old-slides/27-slides-number/03-ellipsis-pagination.md` from SS-03 (visual examples, edge cases, click-`…` behaviour).
6. Add a `controller.ellipsisThreshold` setting spec in the same folder; default 15, range 6–100.
7. Draft the new-slide-types catalog spec — see SS-01. Land it as `spec/old-slides/26-slide-definitions/00-new-types-catalog.md`.
8. For each new slide type in SS-01, create a stub spec file `spec/old-slides/26-slide-definitions/<NN>-<type>.md` with purpose + JSON shape + sample (35 files).
9. Draft the themes catalog spec — see SS-02. Land it as an addendum to `spec/old-slides/21-slides-system/07-theme-system.md`.
10. Document the sample-image → palette mapping in `assets/icons/colors-themes/Palette.md` (cite filenames).
11. Draft the LLM-guideline rewrite outline — see SS-04. Save as `docs/slides/spec/llm-json-guideline.outline.md`.
12. Define the Teams JSON shape (TeamRoster + TeamSpotlight): roles, avatar `url`/`base64`, social link enum, ordering. Record in SS-01 and the LLM outline.
13. Define the JSON schema extensions: new `slideType` enum entries, `controller.ellipsisThreshold`, new `theme` enum entries. Draft in `src/lib/slides/schema.ts` (spec only, not enforced this turn).
14. Define media field unions (`MediaSource = { url } | { base64 } | { inlineSvg }` etc.) and where each is allowed per slide type.
15. Specify variety-guard rules between adjacent slides of the same media-heavy type (avoid two `ImageFullBleed` back-to-back unless author opts in).
16. Specify the in-app "Download LLM guide" affordance in `DeckLauncher.tsx` (link to `/docs/llm-json-guideline.md` and `/docs/sample-deck.json`).
17. Specify the build-time mirror from `docs/slides/spec/*` → `public/docs/*` (script or vite plugin).
18. Specify e2e + unit coverage expectations: `buildPaginationSlots` unit test, deck-with-25-slides e2e, Ubuntu-on-title visual regression.
19. Update `.lovable/memory/index.md` with new Core lines: Ubuntu-headers rule, ellipsis-pagination rule, sample-images-as-theme-source rule.
20. Cross-check Phase A specs against issue 05 and commands 05–08; close any gap before implementation begins.

### Phase B — Ubuntu regression fix (Steps 21–25)

21. Implement the font-link fix in `src/routes/__root.tsx` (preload + correct weights). See `./subtasks/06-slide-types-themes-llm-controller/SS-01-new-slide-types-catalog.md` for typography expectations.
22. Audit every title element in `src/components/slides/types/*` and `RenderSlide.tsx`; replace any literal `font-family` with `var(--font-display)` and `font-weight: 700`.
23. Add a `.slide-title`, `.slide-title-lg`, `.slide-subtitle` token check — ensure they all set `font-family: var(--font-display)` in `src/styles.css`.
24. Add a Vitest snapshot of computed `font-family` for the first slide's title.
25. Visual check against `assets/samples/01-sample.webp` at 1920×1080 fullscreen; capture screenshot and compare.

### Phase C — Slide-indicator ellipsis (Steps 26–32)

26. Implement `buildPaginationSlots(total, current, threshold)` in `src/components/slides/controls/pagination.ts` per SS-03.
27. Wire it into `SlideIndicator.tsx`; render `…` as a button.
28. Wire it into `DotPagination.tsx` (or equivalent) with the same slot model.
29. Add the threshold setting to `SettingsDrawer.tsx`; bind to `riseup.controller.ellipsisThreshold`.
30. Make `…`-click open `GoToInput` popover, focused at the gap midpoint.
31. Add unit tests for `buildPaginationSlots` covering: short deck, current near start/end, exactly threshold + 1.
32. Add an e2e test (`e2e/controller-ellipsis.spec.ts`) for a 25-slide deck.

### Phase D — New slide types (Steps 33–67, 35 types)

33. Scaffold `src/components/slides/types/` shared primitives (MediaResolver, AspectFrame, OverlayScrim).
34. Build **ImageFullBleed** + schema + LLM doc + sample entry.
35. Build **ImageSplit** (+ doc/sample).
36. Build **ImageGrid2x2** (+ doc/sample).
37. Build **ImageGrid3up** (+ doc/sample).
38. Build **ImageMasonry** (+ doc/sample).
39. Build **BeforeAfter** (presenter slider; static split in print) (+ doc/sample).
40. Build **SvgIllustration** (+ doc/sample).
41. Build **AnimatedSvg** (+ doc/sample).
42. Build **GifLoop** (+ doc/sample).
43. Build **VideoEmbed** (+ doc/sample).
44. Build **LottiePlayer** (lazy-load `lottie-web`) (+ doc/sample).
45. Build **DiagramFocus** (multi-step focus zooms) (+ doc/sample).
46. Build **DeviceMockup** (+ doc/sample).
47. Build **MapPin** (+ doc/sample).
48. Build **Quote** (+ doc/sample).
49. Build **TeamRoster** (+ doc/sample) — see SS-04 §Teams.
50. Build **TeamSpotlight** (+ doc/sample).
51. Build **OrgChart** (+ doc/sample).
52. Build **FAQ** (+ doc/sample).
53. Build **PricingTable** (+ doc/sample).
54. Build **StatGrid** (+ doc/sample).
55. Build **KPIRow** (+ doc/sample).
56. Build **ComparisonTable** (+ doc/sample).
57. Build **TwoColumnCompare** (+ doc/sample).
58. Build **Roadmap** (+ doc/sample).
59. Build **GanttLite** (+ doc/sample).
60. Build **CodeBlock** with Shiki-or-equivalent highlighter (+ doc/sample).
61. Build **TerminalReplay** (typewriter + multi-step) (+ doc/sample).
62. Build **MetricChart** (line/area/bar) (+ doc/sample).
63. Build **DonutBreakdown** (+ doc/sample).
64. Build **CalloutCard** with variants (+ doc/sample).
65. Build **CTA** (QR + URL) (+ doc/sample).
66. Build **AgendaList** (+ doc/sample).
67. Build **ChapterDivider** v2 + **EndCard** (+ doc/sample each).

### Phase E — New themes (Steps 68–77)

68. Implement `sample-warm`, `sample-cool`, `sample-editorial` from the three reference images. See `./subtasks/06-slide-types-themes-llm-controller/SS-02-new-themes-catalog.md`.
69. Implement `midnight-indigo` + `ember-charcoal`.
70. Implement `arctic-frost` + `forest-moss` (frost is LIGHT).
71. Implement `cherry-blossom` + `paper-ink` (paper-ink is LIGHT, Swiss editorial).
72. Implement `vapor-chrome`.
73. Append every new id to the `theme` enum in `deck.schema.json` (and `src/lib/slides/schema.ts`).
74. Update `spec/old-slides/21-slides-system/07-theme-system.md` with the new table rows.
75. Update `docs/slides/spec/theme-json-guideline.md` and mirror to `public/docs/theme-json-guideline.md`.
76. Add a theme-picker UI affordance grouping themes by mood (Dark / Light / Accent).
77. Run the manifest round-trip test for every new theme (export → import → re-render matches).

### Phase F — LLM guideline rewrite + download (Steps 78–92)

78. Rewrite `docs/slides/spec/llm-json-guideline.md` per SS-04 §1–4.
79. Add SS-04 §5 Teams section in full.
80. Add SS-04 §6 Themes section in full.
81. Add SS-04 §7 Controller behaviour section.
82. Add SS-04 §8 Transitions + variety guard.
83. Add SS-04 §9 Validation + `bun run lint-deck` walkthrough.
84. Rebuild `docs/slides/spec/sample-deck.json` so it covers at least one instance of every new slide type.
85. Wire the build-time mirror so `public/docs/llm-json-guideline.md` and `public/docs/sample-deck.json` are always up-to-date.
86. Add "Download LLM guide" + "Download sample deck" buttons in `DeckLauncher.tsx`.
87. Validate `sample-deck.json` with `bun run lint-deck` — must pass with zero warnings.
88. Add a top-of-guide changelog stub and bump to v1.0.0.
89. Cross-link from the in-app About panel to the guide URL.
90. Update `README.md` to point new contributors to the guide.
91. Update `CHANGELOG.md` with a single 1.42.0 entry summarising plan 06.
92. Bump `package.json` to `1.42.0` and pin in `README.md`.

### Phase G — Verification, memory, handoff (Steps 93–100)

93. Run `bun run build` — must exit 0.
94. Run unit + e2e suites; fix any regressions before claiming done.
95. Visual QA against `assets/samples/*` for at least one slide per new type at 1920×1080.
96. Open the preview, verify Ubuntu Bold on slide 1, ellipsis pagination on a 25-slide deck, and the download link works.
97. Update `.lovable/memory/features/` with one feature note per major addition (new types, ellipsis, themes, guideline download).
98. Update `.lovable/memory/index.md` Core + Memories sections.
99. Move this plan from `.lovable/plans/pending/06-…md` to `.lovable/plans/completed/06-…md` and flip `Status: completed` in-place during the move.
100. Post-mortem: append a 5-line "what went well / what to repeat" note to `.lovable/memory/diagnostics/` so the next planning turn inherits the learning.

## Verification

- `bun run build` exits 0.
- Vitest + Playwright suites all green; new `pagination` unit tests and `controller-ellipsis` + `ubuntu-title` e2e tests pass.
- DevTools Computed panel on slide 1's title shows `font-family: Ubuntu` at weight 700.
- 25-slide deck renders `1 … 8 9 [10] 11 12 … 25` in the indicator at default threshold.
- `/docs/llm-json-guideline.md` and `/docs/sample-deck.json` are reachable in preview and via the launcher download link.
- `assets/samples/*` palettes are visibly reflected in the three `sample-*` themes.

## Appended from prior pending tasks

- Plan `05-controller-whitebal-fonts.md` is still pending. SS-02
  (white-balance-in-controller popover) and the plan-05 verification/close
  are NOT folded into plan 06; finish plan 05 in its own turn first, then
  start plan 06.
