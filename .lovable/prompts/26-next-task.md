# 26 — Next Task (v5): plan 05 CLOSED, plan 06 Phase A kickoff

**Active plan:** `.lovable/plans/pending/06-slide-types-themes-llm-controller.md` (100 steps)
**Prior plan 05:** CLOSED this turn — moved to `.lovable/plans/completed/05-controller-whitebal-fonts.md` with `Status: completed` and a closure note.

## This turn

**Root cause for closing plan 05 (one sentence):** SS-01 (symmetric back-step
nav) was already correct per the 1.41.0 verification, SS-03 (font antialiasing
+ Ubuntu Bold on hero) shipped in 1.41.0 and 1.44.0, and SS-02 (white-balance
in controller) cannot be a "move" task because `grep -rn "whitebal" src/`
returns zero hits — the slider was never built standalone, so SS-02 is
properly a "build whitebal **inside** ControllerPill" task that belongs with
the broader controller work in plan 06 Phase C, not plan 05.

**Change:** `mv .lovable/plans/pending/05-…md .lovable/plans/completed/05-…md`
+ flip `Status:` frontmatter + add closure note.

## NEXT 3 STEPS — exactly 3

### Step 1 — Plan 06 step 2: RCA + typography addendum

**Reasoning.** The Ubuntu Bold fix landed on the hero (`.slide-display`
→ `.slide-heading`, `.slide-title-lg` weight 400 → 700), but Phase D will
add 35 new slide type renderers — each one is a new chance to drop the
Ubuntu token. The typography addendum (plan 06 step 4) must land as a
written spec under `spec/old-slides/21-slides-system/llm/10-typography.md`
addendum BEFORE any new renderer ships, or the regression will silently
return.

**Time estimate.** ~45 min (read existing `10-typography.md`, append the
Ubuntu-everywhere rule citing the 1.44.0 RCA, add the "do not use
`.slide-display` for headings" anti-pattern note, update
`.lovable/memory/index.md` Core).

**What it unblocks.** Plan 06 Phase D type authors have a normative
reference; Vitest snapshot test (Step 3 below) can cite the spec.

### Step 2 — Plan 06 step 5–6: ellipsis-pagination + threshold spec

**Reasoning.** Command 06 ("dot dot dot when >15 slides, configurable")
is the user's most explicit controller ask. Write the spec
`spec/old-slides/27-slides-number/03-ellipsis-pagination.md` with the
visual example, edge cases (current near start/end, exactly threshold+1),
and `…`-click behaviour. Without this on disk, Phase C step 26
(`buildPaginationSlots`) has nothing to validate against.

**Time estimate.** ~40 min (1 spec file with ASCII visualisations + edge
case table + setting spec for `riseup.controller.ellipsisThreshold`).

**What it unblocks.** Phase C implementation (steps 26–32) — slot
calculator + `SlideIndicator` + `DotPagination` + settings drawer.

### Step 3 — Plan 06 step 24: computed-style snapshot test for Ubuntu Bold

**Reasoning.** Lock the 1.44.0 fix with a Vitest assertion that
`getComputedStyle(titleEl).fontFamily` starts with `Ubuntu` and
`fontWeight === '700'` for the hero/title slide. Phase D will land 35
new renderers — without this test, the next regression goes silently to
production. This is the highest-leverage 30 min of test investment in
plan 06.

**Time estimate.** ~30 min (new test file `RenderSlide.title-font.test.tsx`,
render a `display: true` slide via React Testing Library + jsdom, assert
computed style on the `<h1>`).

**What it unblocks.** All of Phase D (33–67) — type renderers can copy
this test pattern; CI catches future Ubuntu regressions.

---

## Every remaining item (after these 3)

### Plan 06

- **Phase A remainder (steps 7–20):** new-types catalog spec + 35 stub
  type spec files, themes catalog addendum, palette-from-samples doc,
  LLM-guideline outline, Teams JSON shape, schema-extensions draft,
  media unions, variety-guard rules, launcher download spec, `docs/*` →
  `public/docs/*` mirror spec, e2e/unit coverage spec, memory-index Core
  lines, Phase A gap-check.
- **Phase B remainder (steps 21–25):** font-link audit, title-element
  audit across all type renderers, token-check on `.slide-title*`,
  visual diff vs `assets/samples/01-sample.webp`. (Steps 22–23 partially
  shipped in 1.44.0.)
- **Phase C (26–32):** `buildPaginationSlots` + `SlideIndicator` +
  `DotPagination` + threshold setting + `…` popover + unit + e2e tests
  + build whitebal-in-controller (folded from plan-05 SS-02).
- **Phase D (33–67):** 35 new slide types — shared media primitives,
  then ImageFullBleed → EndCard per SS-01.
- **Phase E (68–77):** 10 new themes (3 from `assets/samples/*` + 7
  brand-named) + schema enum + docs + theme picker grouping + manifest
  round-trip.
- **Phase F (78–92):** LLM guideline rewrite per SS-04 §1–9, rebuild
  sample deck, `public/docs/*` mirror, launcher download buttons,
  About-panel link, README + CHANGELOG, version bump.
- **Phase G (93–100):** `bun run build`, unit + e2e green, visual QA vs
  `assets/samples/*`, preview smoke, feature notes, memory index update,
  move plan to `completed/`, post-mortem note.

---

## Definition of done for THIS turn

- [x] Read `.lovable/plans/pending/05-…md`, SS-02 subtask, grep `src/` for whitebal.
- [x] Root cause for closing plan 05 named in one sentence.
- [x] `mv` plan 05 to `completed/`, flip `Status:`, add closure note (no duplicate file).
- [x] Version 1.45.0 + CHANGELOG entry + README pin.
- [x] Prompt 26 saved + `.lovable/prompts/index.md` updated.
