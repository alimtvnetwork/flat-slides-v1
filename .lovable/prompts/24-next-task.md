# 24 — Next Task (v5): execute plan 06 Steps 1–3

**Active plan:** `.lovable/plans/pending/06-slide-types-themes-llm-controller.md`
**Prior plan still pending:** `.lovable/plans/pending/05-controller-whitebal-fonts.md`

The pinned next 3 steps from prompt 23 still stand. Restated here with
fresh code-level signal so the next implementing turn can act without
re-reading.

---

## Code-level signal captured this turn

- `src/styles.css:226` → `.slide-display { font-weight: 400 }`. Headings
  using `.slide-display` (the body-font Poppins display variant) WILL NOT
  be Ubuntu Bold. `.slide-heading` (line 227) is the correct token.
- `src/styles.css:146` body uses Poppins; `:root` `--slide-font-heading`
  resolves to Ubuntu (line 154). Slide 1 title likely uses
  `.slide-display` instead of `.slide-heading`, OR uses no token at all
  and inherits Poppins from body.
- Controller surface confirmed: `ControllerPill.tsx`, `DotPagination.tsx`,
  `ControllerOverflowMenu.tsx` (with parity test). SS-02 must reuse
  `ControllerPill.tsx` popover slot and keep `ControllerOverflowMenu.parity.test.tsx` green.

## NEXT 3 STEPS — exactly 3

### Step 1 — Close plan 05 (SS-02 white-balance-in-controller)

**Reasoning.** Plan 05 is still pending and touches `ControllerPill.tsx`
and `SettingsDrawer.tsx` — the exact surfaces plan 06 Phase C (ellipsis
in `SlideIndicator`) will mutate. Land SS-02 first so the controller has
one stable shape before plan 06 grows it. Skipping = merge churn and a
broken parity test halfway through plan 06.

**Time estimate.** ~60 min (50 min SS-02 popover move + parity test
update, 10 min `mv` plan-05 to `completed/` and flip `Status:` in
frontmatter).

**What it unblocks.** Plan 06 implementation can start; the controller
parity test stays green for the rest of plan 06.

### Step 2 — RCA the Ubuntu regression on slide 1 (plan 06, step 2)

**Reasoning.** Strong hypothesis from this turn's grep: slide 1's title
element either uses `.slide-display` (Poppins, weight 400) or no font
class at all (inherits Poppins from body line 146). Until we open
`src/components/slides/RenderSlide.tsx` and the title-slide type renderer
in `src/components/slides/types/` and name the exact element + class,
"fix the font" is a guess. The user explicitly banned symptom patches.

**Time estimate.** ~30 min (read `RenderSlide.tsx` + title type
renderer + `src/styles.css:200-230`, open preview, capture DevTools
Computed `font-family` for slide 1's `<h1>`, write the 1-sentence root
cause into `.lovable/memory/diagnostics/`).

**What it unblocks.** A 1-line root cause → the minimum correct change
in Step 3 and the typography-addendum spec in plan 06 step 4.

### Step 3 — Ship the Ubuntu fix + computed-style snapshot (plan 06 steps 21–24)

**Reasoning.** With root cause named, the minimum correct change is one
of: swap `.slide-display` → `.slide-heading` on the title element, add
the missing class, or change `.slide-display`'s `font-family` token.
Lock it with a Vitest snapshot of `getComputedStyle(titleEl).fontFamily`
so the regression cannot silently come back when plan 06 Phase D adds 35
new slide types — each type renderer is a new chance to drop the token.

**Time estimate.** ~45 min (15 min fix, 20 min snapshot test, 10 min
visual diff against `assets/samples/01-sample.webp`).

**What it unblocks.** Phase A spec writing (steps 4–20) can proceed
without the user staring at a broken slide 1; Phase D type renderers
have a passing test to copy from.

---

## Every remaining item (after these 3)

### Plan 05 — fully closed once Step 1 lands.

### Plan 06 — same backlog as prompt 23

- **Phase A remainder (steps 4–20):** typography addendum, ellipsis spec,
  `controller.ellipsisThreshold` spec, new-types catalog spec, 35 stub
  type spec files, themes catalog addendum, palette-from-samples doc,
  LLM guideline outline, Teams JSON shape, schema extensions draft,
  media unions, variety-guard rules, launcher download spec, `docs/*` →
  `public/docs/*` mirror spec, e2e/unit coverage spec, memory index
  Core lines, Phase A close-out gap-check.
- **Phase C (26–32):** `buildPaginationSlots` + `SlideIndicator` +
  `DotPagination` + settings drawer threshold + `…`-click popover +
  unit + e2e tests.
- **Phase D (33–67):** 35 new slide types, starting with shared media
  primitives, then ImageFullBleed → EndCard per SS-01.
- **Phase E (68–77):** 10 new themes (3 from `assets/samples/*` + 7
  brand-named) + schema enum + docs + theme picker grouping + manifest
  round-trip.
- **Phase F (78–92):** LLM guideline rewrite per SS-04 §1–9, rebuild
  sample deck covering every new type, `public/docs/*` mirror, launcher
  download buttons, About-panel link, README + CHANGELOG, version bump
  to 1.43.0.
- **Phase G (93–100):** `bun run build`, unit + e2e green, visual QA vs
  `assets/samples/*`, preview smoke (Ubuntu / ellipsis / download),
  feature notes, memory index update, move plan to `completed/`,
  post-mortem note.

---

## Definition of done for THIS turn (planning-only)

- [x] Prompt 24 saved under `.lovable/prompts/`.
- [x] Version bumped to 1.43.0 + CHANGELOG entry.
- [x] README pinned version updated.
- [x] `.lovable/prompts/index.md` Latest line updated.
- [ ] No product code change this turn — Steps 1–3 execute next turn.
