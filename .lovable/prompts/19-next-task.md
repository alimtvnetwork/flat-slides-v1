# 19 — Next task

## Source request
"Next 2 Steps" prompt (v5) — picks the two most blocking items from plan
`.lovable/plans/pending/05-controller-whitebal-fonts.md` and issue
`.lovable/issues/04-controller-whitebal-step-back-fonts.md`.

## Read first
- `.lovable/plans/pending/05-controller-whitebal-fonts.md` (8-step plan).
- `.lovable/plans/subtasks/05-controller-whitebal-fonts/SS-01-step-back-nav.md`.
- `.lovable/plans/subtasks/05-controller-whitebal-fonts/SS-03-font-rendering.md`.
- `src/components/slides/SlidePresenterPage.tsx` — keyboard handler / prev path.
- `src/components/slides/RenderSlide.tsx` + `src/styles.css` — title weight & smoothing.

## Next 2 steps

### Step 1 — Symmetric back-step navigation (SS-01)
- **Reasoning:** Forward stepping works, back jumps straight to previous
  slide, skipping intermediate steps on `steps`/`timeline` slides. User
  reported it explicitly ("Currently, we cannot fix it"). Until back
  navigation mirrors forward, every multi-step slide is one-way — the
  presenter cannot recover from an over-advance during a live demo.
- **Time estimate:** ~45 min (read handler, add `goPrevStep` helper, route
  ArrowLeft / PageUp / `k` / swipe through it, land on `lastStep` of prev
  slide, add a vitest covering the boundary).
- **Unblocks:** Reliable demo flow; closes the most-frustrating regression
  before touching cosmetics. Required before any presenter UX polish.

### Step 2 — Heading font weight + anti-aliasing (SS-03)
- **Reasoning:** Titles render as faux-bold of Ubuntu 400 because the
  Google Fonts request only loads weight 400, and `src/styles.css`
  lacks `-webkit-font-smoothing: antialiased` on the slide surface.
  Result is the blurry "terrible" headings the user keeps screenshotting.
  Fix is small, high signal-to-noise, and immediately visible in preview.
- **Time estimate:** ~30 min (extend Ubuntu weight set in `index.html`,
  restore `--slide-title-weight: 700`, add global smoothing rules, verify
  Computed styles in DevTools).
- **Unblocks:** Visual quality stops dominating every screenshot, so the
  next step (white-balance in controller) can be reviewed on its own
  merits instead of being drowned out by the bad type.

## Remaining items (full picture)
From plan 05:
1. ✅ (this turn — Step 1 above) — SS-01 step-back nav.
2. ✅ (this turn — Step 2 above) — SS-03 font rendering.
3. SS-02 — Move white-balance slider into ControllerPill popover; remove
   standalone slider mount; keep persistence key intact.
4. Update controller/shortcut parity test + LLM guide bundle if a new
   action id is introduced; only bump `riseup.controller.anchor` key if
   layout actually shifts.
5. End-to-end verification: forward+back across a 3-step slide,
   white-balance popover open/close + persistence, heading Computed
   style check in fullscreen.
6. Move plan 05 to `.lovable/plans/completed/` and flip `Status: completed`.

Beyond plan 05: no other pending plans in `.lovable/plans/pending/` after
this. Open issues directory still contains 04 (this plan's source);
issues 01–03 are already closed.
