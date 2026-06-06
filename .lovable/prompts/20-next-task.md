# 20 — Next task

## Source request
"Next 2 Steps or Tasks (v5)" prompt — exactly 2 next steps, each with reasoning, realistic time estimate, and what it unblocks; then list every remaining item, bump version metadata, update changelog/release notes, pin the root README version, and save this prompt under `.lovable/prompts/`.

## Files actually read
- `.lovable/coding-guidelines.md` — coding guideline file exists and applies; no `spec/coding-guidelines/` folder and no `.lovable/seo-guidelines.md` were present.
- `.lovable/plan.md` — broader roadmap still references older fullscreen/step/highlight work; current actionable queue is the pending plan below.
- `.lovable/memory/index.md` — memory rules relevant to slides: no default camera zoom, no highlight glow, controller pill contract, step URL contract.
- `.lovable/plans/pending/05-controller-whitebal-fonts.md` — 8-step pending plan for back-step nav, white-balance-in-controller, and font rendering.
- `.lovable/issues/04-controller-whitebal-step-back-fonts.md` — source issue with the three user-reported regressions.
- `src/components/slides/SlidePresenterPage.tsx` — key handler at lines 166–227; current reverse-step helper at lines 323–331; controller wiring at lines 397–411; route-step parsing at lines 467–476.
- `src/components/slides/RenderSlide.tsx` — slide title weight sites at lines 118, 156–159, 163; `ThemeWrap` typography token path at lines 68–100.
- `src/styles.css` — font tokens at lines 62–65 and 164–166; slide title/heading CSS at lines 197–223; highlight constraints at lines 235–247.
- `src/components/slides/controls/ControllerPill.tsx` — current controller buttons and Settings entry at lines 80–128; no white-balance popover is mounted there yet.

## One-sentence root cause
The active plan still has unresolved implementation work, so the correct next task output must be derived from the pending plan and source-level audit rather than inventing or reordering work.

## Next 2 steps

### Step 1 — Symmetric back-step navigation (SS-01)
- **Reasoning:** `SlidePresenterPage.tsx` already routes forward navigation through `moveNextStepAware()` (lines 333–337), but the plan still requires a deeper symmetric back-step fix because the user reports multi-step slides cannot walk back reliably across keyboard/controller/swipe paths. If skipped, `steps`/`timeline` slides remain one-way during live presentation and an over-advance cannot be recovered without leaving the current flow.
- **Time estimate:** ~45 minutes — audit `dispatchPresenterKey` nav ids plus `movePrevStepAware()`, add/adjust a focused regression test for reverse stepping and previous-slide boundary behavior, then verify ArrowLeft/PageUp/`k`/controller previous route through the same logic.
- **What it unblocks:** A trustworthy presenter navigation baseline; without it, UI polish around the controller still sits on broken deck traversal.

### Step 2 — Heading font weight + anti-aliasing (SS-03)
- **Reasoning:** `src/styles.css` defines Ubuntu heading/display tokens and 700-weight heading CSS, while `RenderSlide.tsx` still uses 400 for display titles (line 158) and the slide surface lacks explicit font-smoothing at the read lines. If skipped, fullscreen screenshots continue to look blurry/faux-weighted and the user cannot judge the controller layout separately from typography defects.
- **Time estimate:** ~30 minutes — confirm the actual font import location, load Ubuntu 400/500/700, set display/title weight intentionally, add `-webkit-font-smoothing`, `-moz-osx-font-smoothing`, and `text-rendering` on the slide rendering surface, then verify computed styles in preview/fullscreen.
- **What it unblocks:** Visual quality review in fullscreen; after typography is stable, the white-balance controller change can be evaluated without the font issue dominating feedback.

## Remaining items after these 2
3. SS-02 — Move the white-balance slider into `ControllerPill` as a compact popover/control launched from the existing controller surface; remove any standalone floating slider mount while preserving the existing persisted value key.
4. Update controller/shortcut parity tests and the LLM guide bundle only if the implementation introduces a new action id or public control contract.
5. End-to-end verification: forward and backward through a 3-step slide; controller previous/next behavior; white-balance popover open/close and persistence; fullscreen heading computed style confirms Ubuntu + intended weight + antialiasing.
6. Close plan 05 by moving `.lovable/plans/pending/05-controller-whitebal-fonts.md` to completed and flipping `Status: completed` only after the verified implementation lands.

## Version / release-note changes from this prompt
- `package.json` bumped from `1.38.0` to `1.39.0`.
- `README.md` pinned version bumped from `1.38.0` to `1.39.0`.
- `CHANGELOG.md` gained release-note entry `1.39.0` for this planning/audit turn.
- `.lovable/prompts/index.md` latest prompt updated to `20-next-task.md`.