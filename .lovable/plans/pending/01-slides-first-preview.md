# Slides-first preview + controller/settings alignment with spec

**Slug:** slides-first-preview
**Steps:** 30
**Status:** pending
**Created:** 2026-06-06

## Context

The preview's `/` currently renders a marketing landing
(`src/routes/index.tsx`) and only links into the slides app. The user
requires slides to be the FIRST surface, with a launcher exposing every
documented case (Present, Inspector, Handout, Handout-3up, Print,
Audience). Controller and settings behavior must follow the source-of-
truth specs under `spec/old-slides/controller-2026/`,
`spec/old-slides/27-slides-number/`, `spec/old-slides/21-slides-system/`,
and `spec/old-slides/22-slides-issues/`.

This is a **plan-only turn**. No code edits. RCA + plan + subtask files
are the only artifacts.

**Captured this turn:**
- Command: `.lovable/spec/commands/01-slides-first-preview.md`
- Command: `.lovable/spec/commands/02-write-rca-before-implementing.md`
- Issue: `.lovable/issues/01-root-not-slides-first.md`

**Diagnostics (must exist before any implementation step runs):**
- `.lovable/memory/diagnostics/03-root-not-slides-first-rca.md`
- `.lovable/memory/diagnostics/04-controller-vs-spec-rca.md`
- `.lovable/memory/diagnostics/05-settings-vs-spec-rca.md`

## Steps

1. Read every file under `spec/old-slides/21-slides-system/` (system,
   architecture, slide types, JSON contracts). Record gaps vs current
   `src/components/slides/` in the RCA file from step 4.
2. Read every file under `spec/old-slides/22-slides-issues/` and cross-
   reference against `spec/issues/`; list which historic issues are still
   reproducible today.
3. Read every file under `spec/old-slides/27-slides-number/` (top-bar,
   badge, dot-pagination, controller indicator, jumper, sound,
   visibility, accessibility, tokens, acceptance). Tabulate which
   surfaces the current build implements and which it omits.
4. Read every file under `spec/old-slides/controller-2026/` (01–11
   including all C0X build substeps). Produce
   `.lovable/memory/diagnostics/04-controller-vs-spec-rca.md` mapping
   each controller spec rule to the current `ControllerPill.tsx` +
   `presenterActions.ts` implementation. Mark each row: matches /
   partial / missing.
5. Read every file under `spec/old-slides/camera-2026/` and the existing
   `.lovable/camera-controller-2026-gap-tasks.md`. Note camera-bubble
   gaps that affect the slides-first surface (camera must be reachable
   from the launcher).
6. Write the root-cause file
   `.lovable/memory/diagnostics/03-root-not-slides-first-rca.md`
   explaining why `/` shipped as marketing, what assumptions were wrong,
   and what the corrected information architecture must look like. See
   `./subtasks/01-slides-first-preview/01-rca-root-landing.md`.
7. Write `.lovable/memory/diagnostics/05-settings-vs-spec-rca.md`
   mapping the current `SettingsDrawer.tsx` against
   `spec/old-slides/27-slides-number/10-visibility-and-settings.md`
   (and the camera/controller spec). Mark each setting row matches /
   partial / missing.
8. Decide and document the IA in
   `./subtasks/01-slides-first-preview/02-ia-decision.md`: `/` = slides
   canvas + launcher; marketing content (if retained) moves to
   `/about`; `/slides` keeps acting as the deep-link surface.
9. Inventory every documented "case" the launcher must expose, sourced
   from spec folders. Output:
   `./subtasks/01-slides-first-preview/03-launcher-cases.md`. Each row:
   case name, target route or action, spec citation, current support
   status.
10. Define the launcher visual contract (position, z-index, hover-
    reveal vs always-on, reduced-motion behavior) in
    `./subtasks/01-slides-first-preview/04-launcher-visual-contract.md`,
    aligned with `27-slides-number/06-surface-controller-indicator.md`
    and the controller-2026 hover-reveal rules.
11. Plan the controller-pill anchor + overflow behavior changes needed
    so it co-exists with the new launcher at all viewport widths
    (≥1280 / <1280). Reference `mem://features/presenter-controller-pill`.
    See `./subtasks/01-slides-first-preview/05-controller-coexistence.md`.
12. Plan the settings drawer alignment work: which settings rows must
    be added / renamed / removed to match the 27-slides-number visibility
    spec, and how persistence keys map (`riseup.*`). See
    `./subtasks/01-slides-first-preview/06-settings-alignment.md`.
13. Specify the new component tree:
    `SlidesHomeShell` (root for `/`) → `<ScaledSlide />` +
    `<DeckLauncher />` + existing `<ControllerPill />`. Document
    props, ownership of fullscreen / inspector / handout actions.
14. Specify route changes: `src/routes/index.tsx` becomes the slides
    shell; current marketing content moves to a new
    `src/routes/about.tsx`. Update `__root.tsx` head defaults so the
    deck title (not marketing copy) is the SSR meta.
15. Specify head/meta changes per `tanstack-route-architecture`:
    leaf-only og:image; `/` meta = deck title; `/about` keeps the
    marketing meta.
16. Specify keyboard-shortcut audit: the launcher MUST NOT shadow any
    SHORTCUTS-id binding owned by the controller/inspector. Reference
    `mem://features/presenter-controller-pill` parity test.
17. Specify accessibility contract for the launcher (focus order, ARIA
    labels, keyboard activation) per
    `spec/old-slides/27-slides-number/11-accessibility-and-motion.md`.
18. Specify reduced-motion behavior for launcher mount/unmount: opacity
    + ≤16px translate only, no scale, per project memory core rule.
19. Specify test plan: unit tests for `DeckLauncher` (each case button
    renders + targets correct route/action), route tests for `/`
    rendering the slides canvas, and an updated `slides.index.tsx` test
    to cover redirect-or-mount semantics. See
    `./subtasks/01-slides-first-preview/07-test-plan.md`.
20. Specify e2e additions: extend `e2e/controller-happy-path.spec.ts`
    and `e2e/fullscreen-present.spec.ts` to start from `/` (not
    `/slides`) and assert launcher → present → fullscreen path.
21. Specify telemetry: emit `home-launcher-click` events with `{ case }`
    via `onSlidesEvent` so future regressions are observable. Reference
    `src/components/slides/telemetry.ts`.
22. Specify migration of existing home-present helpers
    (`HOME_PRESENT_SLIDE_ID`, `getHomePresentUrl`,
    `openHomePresenterWindow`, `shouldNavigateHomeAfterPresent`) into
    the new shell without behavior change. List which call sites move.
23. Specify how the launcher behaves under SSR / prerender: must render
    static buttons without requiring a session; any auth-gated action
    follows `tanstack-auth-guards` (none expected today, document the
    decision).
24. Specify CHANGELOG + version bump policy for this work: minor bump
    (project rule: code changes bump at least minor), CHANGELOG entry
    naming both the IA change and the spec-alignment fixes.
25. Specify spec-issue lifecycle updates: which entries in
    `spec/issues/` become `fixed` after implementation (e.g. any
    surfacing the marketing-first regression), and which new entries
    are filed for controller/settings spec gaps surfaced in steps 4 + 7.
26. Specify the documentation update: create
    `docs/slides/home-shell.spec.md` describing the new `/` contract
    so future agents do not regress it.
27. Specify the memory updates: add a Core line to `mem://index.md`
    pinning "Root `/` renders slides first; marketing lives at
    `/about`. Launcher exposes every documented case." Also add a
    memory file `mem://features/slides-home-shell` linking to the
    docs spec.
28. Specify the rollback plan: if the new shell regresses the
    presenter window, gating logic should fall back to the legacy
    `/slides` route via a feature flag in
    `src/components/slides/featureFlags.ts` (introduce if absent).
29. Specify a verification matrix mapping each Step (1–28) → artifact
    on disk → check that proves it landed (file exists, test passes,
    preview screenshot). See
    `./subtasks/01-slides-first-preview/08-verification-matrix.md`.
30. Final review gate: re-read this plan top-to-bottom, confirm each
    diagnostic file exists, confirm every subtask file exists, then
    (in a separate, future turn) begin executing Step 1's
    implementation per the captured RCA. NO execution this turn.

## Verification

- All three diagnostic files exist under
  `.lovable/memory/diagnostics/` before any implementation begins.
- All subtask files referenced above exist under
  `.lovable/plans/subtasks/01-slides-first-preview/`.
- Plan file present at `.lovable/plans/pending/01-slides-first-preview.md`.
- Captured command files exist under `.lovable/spec/commands/`.
- Issue file exists at `.lovable/issues/01-root-not-slides-first.md`.
- On a later turn, execution will be measured by: `/` renders the deck
  + launcher, every launcher button hits its spec-defined target,
  controller + settings parity tests pass, e2e suite green, CHANGELOG
  + version bumped, plan moved to `.lovable/plans/completed/`.

## Appended from prior pending tasks

Scanned `.lovable/` — no pre-existing files under `plans/pending/`,
`plans/completed/`, `plans/subtasks/`, `spec/commands/`, or `issues/`
(the folders did not exist before this turn). Related prior context
that informs this plan but is NOT a pending task to merge: 
`.lovable/camera-controller-2026-gap-tasks.md`,
`.lovable/pending-issues/`, `.lovable/cicd-issues/`,
`.lovable/suggestions/`, `.lovable/todo-tasks.md`. These will be
folded into follow-up plans as separate XX-<slug> files; they are NOT
duplicated into this plan's step list.
