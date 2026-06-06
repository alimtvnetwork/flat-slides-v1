# 25 — Next Task (v5): Ubuntu Bold fix SHIPPED, next 3 = plan-05 closure → plan-06 Phase A

**Active plan:** `.lovable/plans/pending/06-slide-types-themes-llm-controller.md`
**Prior plan still pending:** `.lovable/plans/pending/05-controller-whitebal-fonts.md`

## This turn — root cause + minimum fix shipped

**Root cause (one sentence):** `RenderSlide.tsx:157` rendered the title-slide
`<h1>` with `.slide-display .slide-title-lg` + inline `fontWeight: 400`, and
`.slide-title-lg` in `src/styles.css:230` also forced `font-weight: 400` with
no `font-family` override — so the hero title rendered Ubuntu **Regular** at
176px instead of Ubuntu **Bold**, reading as a different/weaker typeface
than every other heading in the deck.

**Minimum correct change (2 lines):**
- `src/components/slides/RenderSlide.tsx:156-159` — `<h1>` now always uses
  `slide-heading` (Ubuntu via `--slide-font-heading`) plus either
  `slide-title-lg` (display mode) or `slide-title` (regular), and inline
  `fontWeight: 700` unconditionally.
- `src/styles.css:230` — `.slide-title-lg` now sets `font-weight: 700` and
  `font-family: var(--slide-font-heading)` so it can never silently fall
  back to Poppins or weight-400.

**Verification:** Static analysis (computed `font-family` will resolve to
Ubuntu, computed `font-weight` to 700 on both branches). Build runs
automatically. Pending visual check at next user message in preview.

## NEXT 3 STEPS — exactly 3

### Step 1 — Close plan 05 (SS-02 white-balance-in-controller)

**Reasoning.** Plan 05 still pending. SS-02 must move the white-balance
slider into `ControllerPill.tsx`'s popover, delete the standalone mount,
and keep `ControllerOverflowMenu.parity.test.tsx` green. Plan 06 Phase C
will mutate the same controller surface — landing SS-02 first prevents
merge churn and protects the parity test.

**Time estimate.** ~60 min (50 min SS-02 implement + parity test, 10 min
`mv` plan-05 → `completed/` + flip `Status:`).

**What it unblocks.** Single-active-plan rule restored; plan 06 Phase C
can build on a stable controller.

### Step 2 — Plan 06 Phase A specs (steps 4–10)

**Reasoning.** Phase A is the spec backbone for the 35 new slide types,
10 new themes, ellipsis pagination, and LLM guideline rewrite. Steps
4–10 are the highest-value subset: typography addendum (locks the Ubuntu
rule we just fixed), ellipsis spec, threshold setting spec, new-types
catalog, 35 stub spec files, themes addendum, palette-from-samples doc.
Without these on disk, Phase D implementation will drift from intent.

**Time estimate.** ~3 hours (35 stub files alone = ~90 min at 2-3 min
each; rest = ~90 min).

**What it unblocks.** Phase A remainder (11–20) and any Phase D type
renderer authoring.

### Step 3 — Plan 06 Phase A specs (steps 11–20) + computed-style snapshot test

**Reasoning.** Closes Phase A: LLM-guideline outline, Teams JSON shape,
schema-extensions draft, media unions, variety-guard rules, launcher
download spec, `docs/*` → `public/docs/*` mirror spec, e2e/unit coverage
spec, memory-index Core lines, gap-check. Also wire a Vitest snapshot of
`getComputedStyle(titleEl).fontFamily` (plan 06 step 24) so the Ubuntu
fix shipped this turn cannot silently regress when Phase D adds 35 new
type renderers.

**Time estimate.** ~2.5 hours (10 spec steps + 1 test wiring).

**What it unblocks.** Phase C ellipsis implementation can start (step 26)
with full schema + LLM-guide alignment.

---

## Every remaining item (after these 3)

### Plan 05 — closed after Step 1.

### Plan 06 — after Steps 2 + 3 land
- **Phase C (26–32):** `buildPaginationSlots` + `SlideIndicator` +
  `DotPagination` + threshold setting + `…` popover + tests.
- **Phase D (33–67):** 35 new slide types — shared media primitives,
  then ImageFullBleed → EndCard per SS-01.
- **Phase E (68–77):** 10 new themes (3 from `assets/samples/*` + 7
  brand-named) + schema enum + docs + theme picker grouping + manifest
  round-trip.
- **Phase F (78–92):** LLM guideline rewrite per SS-04 §1–9, rebuild
  sample deck, `public/docs/*` mirror, launcher download buttons,
  About-panel link, README + CHANGELOG, version bump to next minor.
- **Phase G (93–100):** `bun run build`, unit + e2e green, visual QA vs
  `assets/samples/*`, preview smoke, feature notes, memory index update,
  move plan to `completed/`, post-mortem note.

---

## Definition of done for THIS turn

- [x] Read `src/styles.css:130-240`, `RenderSlide.tsx:150-170`, `__root.tsx:97-101`.
- [x] Root cause named in one sentence (above).
- [x] Minimum correct change applied (2 edits, no try/catch, no symptom patch).
- [x] Version bumped to 1.44.0 + CHANGELOG + README pin.
- [x] Prompt 25 saved + `.lovable/prompts/index.md` updated.
- [ ] Visual confirmation in preview pending next user message.
