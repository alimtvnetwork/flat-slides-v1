# 23 — Next Task (v5): plan 06 kickoff — RCA Ubuntu regression, then start Phase A

**Active plan:** `.lovable/plans/pending/06-slide-types-themes-llm-controller.md` (100 steps)
**Prior plan still pending:** `.lovable/plans/pending/05-controller-whitebal-fonts.md` (SS-02 + closure)

---

## Read this turn

- `.lovable/plans/pending/06-slide-types-themes-llm-controller.md` — steps 1–20 (Phase A).
- `.lovable/plans/subtasks/06-slide-types-themes-llm-controller/SS-01..SS-04.md`.
- `.lovable/issues/05-first-slide-not-ubuntu.md`.
- `.lovable/spec/commands/05..08-*.md` (all four).
- Source: `src/routes/__root.tsx`, `src/components/slides/RenderSlide.tsx`, every file in `src/components/slides/types/`, `src/styles.css`.
- Memory: `.lovable/memory/index.md`.

## NEXT 3 STEPS — exactly 3

### Step 1 — Plan 05 closure (SS-02 white-balance-in-controller + move to completed)

**Reasoning.** Plan 05 is still pending and blocks plan 06; per the project's
single-active-plan rule, opening a 100-step plan while a previous one is
half-done multiplies in-flight work and produces merge conflicts in
`ControllerPill.tsx` and `SettingsDrawer.tsx` — the exact files plan 06's
controller-ellipsis step also touches. If skipped, Phase C of plan 06
(steps 26–32) will collide with SS-02's controller surface and force a
rewrite mid-implementation.

**Time estimate.** ~60 min (50 min SS-02 implement + parity test, 10 min
move plan file, flip `Status:`, bump CHANGELOG entry).

**What it unblocks.** A clean `ControllerPill.tsx` baseline so Step 2 below
can RCA the Ubuntu regression without picking through an in-flight popover
refactor, and plan 06 Phase C can be implemented later without rebasing.

### Step 2 — RCA the Ubuntu regression (plan 06, step 2)

**Reasoning.** Issue 05 is the user's most recent visible complaint ("the
first slide looks terrible, does not have the Ubuntu font"). Until we name
the exact element + CSS path that loses Ubuntu, every "fix" is a guess.
The plan's step 22 (audit all title elements) and step 24 (computed-style
snapshot test) only land correctly if we know whether the cause is the
font `<link>` (root.tsx), a literal `font-family` in a type renderer, or a
Tailwind utility overriding `var(--font-display)`. Skipping RCA means
patching symptoms again — exactly the pattern the user said to stop.

**Time estimate.** ~30 min (open `RenderSlide.tsx` + `src/components/slides/types/*` + `src/styles.css`, run preview, capture DevTools Computed `font-family` for slide 1's title, write one-sentence root cause into `.lovable/memory/diagnostics/`).

**What it unblocks.** A 1-line root cause → the minimum correct change in
Step 3, and the typography addendum in plan 06 step 4 can cite the exact
selector that failed.

### Step 3 — Ship the Ubuntu fix + computed-style snapshot (plan 06 steps 21–24)

**Reasoning.** With root cause named, the minimum correct change is small
(font `<link>` weights, OR one `font-family` literal, OR a missing
`var(--font-display)` on a `.slide-title*` class). Lock it with a Vitest
snapshot of `getComputedStyle(titleEl).fontFamily` so the regression cannot
silently come back when plan 06 Phase D adds 35 new slide types — each
type renderer is a new chance to drop the token. Skipping the snapshot
means we'll re-debug this in two weeks.

**Time estimate.** ~45 min (15 min fix, 20 min snapshot test wiring, 10 min
visual diff against `assets/samples/01-sample.webp` at 1920×1080).

**What it unblocks.** Plan 06 Phase A spec writing (steps 4–20) can proceed
without the user staring at a broken slide 1; and Phase D type renderers
have a passing test to copy from.

---

## Every remaining item (after these 3)

### Plan 05 — fully closed once Step 1 above lands. Nothing further.

### Plan 06 — remaining work after Steps 2 + 3 above land

**Phase A — Spec & RCA (remaining: 4–20)**
- 4. Typography addendum spec (Ubuntu-everywhere rule).
- 5. Ellipsis-pagination spec `spec/old-slides/27-slides-number/03-ellipsis-pagination.md`.
- 6. `controller.ellipsisThreshold` setting spec.
- 7. New-slide-types catalog spec (cites SS-01).
- 8. 35 stub spec files under `spec/old-slides/26-slide-definitions/`.
- 9. Themes catalog addendum (cites SS-02).
- 10. Sample-image → palette mapping in `assets/icons/colors-themes/Palette.md`.
- 11. LLM-guideline outline `docs/slides/spec/llm-json-guideline.outline.md`.
- 12. Teams JSON shape definition.
- 13. JSON schema extensions drafted (no enforcement yet).
- 14. Media field unions (`MediaSource`).
- 15. Variety-guard rules for adjacent media-heavy slides.
- 16. "Download LLM guide" affordance spec for `DeckLauncher.tsx`.
- 17. Build-time `docs/slides/spec/*` → `public/docs/*` mirror spec.
- 18. e2e + unit coverage spec.
- 19. `.lovable/memory/index.md` Core lines (Ubuntu / ellipsis / sample-images).
- 20. Phase A close-out gap-check against issue 05 + commands 05–08.

**Phase C — Slide-indicator ellipsis (26–32)** — `buildPaginationSlots`, wire `SlideIndicator` + `DotPagination`, settings drawer threshold, `…`-click → `GoToInput`, unit + e2e tests.

**Phase D — 35 new slide types (33–67)** — shared primitives, then ImageFullBleed → EndCard per SS-01.

**Phase E — 10 new themes (68–77)** — `sample-warm/-cool/-editorial`, `midnight-indigo`, `ember-charcoal`, `arctic-frost`, `forest-moss`, `cherry-blossom`, `paper-ink`, `vapor-chrome` + schema enum + docs + theme picker grouping + manifest round-trip.

**Phase F — LLM guideline rewrite + download (78–92)** — full rewrite per SS-04 §1–9, rebuild sample deck covering every new type, `public/docs/*` mirror, launcher download buttons, About-panel link, README + CHANGELOG, version bump to 1.42.0.

**Phase G — Verification & handoff (93–100)** — `bun run build`, unit + e2e green, visual QA vs `assets/samples/*`, preview smoke (Ubuntu / ellipsis / download), feature notes in `.lovable/memory/features/`, memory index update, move plan to `completed/`, post-mortem note.

---

## Definition of done for THIS turn (planning-only)

- [x] Prompt 23 saved under `.lovable/prompts/`.
- [x] Version bumped to 1.42.0 with CHANGELOG entry.
- [x] README pinned version updated.
- [x] `.lovable/prompts/index.md` Latest line updated.
- [ ] No product code change this turn — Steps 1–3 are executed in the next turn.
