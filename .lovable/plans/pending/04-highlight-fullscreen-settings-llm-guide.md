# Highlight, fullscreen, settings color pickers, and downloadable LLM guide

**Slug:** highlight-fullscreen-settings-llm-guide
**Steps:** 30
**Status:** pending
**Created:** 2026-06-06

## Context

User reported (voice note): yellow `.hl` highlighter is invisible on slides; the controller fullscreen button only expands within the embedded preview instead of entering the browser Fullscreen API; the Settings drawer is missing text-color and highlight-color pickers; and there is no "Guide" section in Settings to download the LLM/theme/slide-JSON authoring guides as a zip. User also requires that the root cause analysis for the highlight + fullscreen regressions be written to both `.lovable/memory/diagnostics/` and the matching `.lovable/issues/` file so it can be shared with any future AI.

Captured command: `.lovable/spec/commands/04-write-rca-to-memory-and-issues.md`
Captured issue: `.lovable/issues/03-highlight-fullscreen-settings-and-llm-guide.md`

## Steps

1. Re-read every active spec/command/guideline that applies: `.lovable/coding-guidelines.md`, `.lovable/spec/commands/01..04`, `.lovable/memory/specs/02-text-shadow-highlight.md`, `.lovable/memory/decisions/02-highlight-text-shadow.md`, `.lovable/memory/avoid/02-no-hl-glow.md`, `docs/slides/spec/present-fullscreen.spec.md`, `docs/slides/fullscreen-present-fallback.spec.md`, `docs/slides/spec/llm-json-guideline.md`. List which rules constrain this plan.
2. Trace the `.hl` emission path end-to-end (RichText / markHighlights / slide renderers) and confirm whether the active deck actually outputs `<span class="hl">` for highlighted words. See ./subtasks/04-highlight-fullscreen-settings-llm-guide/01-hl-emission-trace.md.
3. Confirm in `src/styles.css` that `.hl` defines both a visible yellow background/color AND the locked `text-shadow: rgb(0 0 0) 1px 0.7px 0px;` — without violating the no-glow / no-blur avoid rule.
4. Fix the highlight visibility: either the rendering path that drops `.hl`, or the CSS token that makes the yellow invisible against the current background. Choose the smaller surgical fix; do not change the shadow spec.
5. Add a regression test that mounts a slide with highlighted keywords and asserts `.hl` is present in the DOM AND that its computed `background-color` is a non-transparent yellow.
6. Write the highlight RCA to `.lovable/memory/diagnostics/07-highlight-invisible-rca.md` covering: what broke, why it broke (token vs emission vs override), how it was missed, the test that now locks it. See ./subtasks/04-highlight-fullscreen-settings-llm-guide/02-highlight-rca.md.
7. Append the highlight RCA summary to `.lovable/issues/03-highlight-fullscreen-settings-and-llm-guide.md` under an `## RCA — highlight` section so the issue file is shareable on its own.
8. Trace the controller fullscreen action: `presenterActions.ts` fullscreen handler, `enterFullscreen` helper, the embedded-vs-top-level branch documented in `.lovable/plans/pending/02-present-fullscreen-preview-fix.md` and `docs/slides/fullscreen-present-fallback.spec.md`. See ./subtasks/04-highlight-fullscreen-settings-llm-guide/03-fullscreen-trace.md.
9. Decide the resolution per the existing RCA `06-present-fullscreen-preview-rca.md`: when embedded in the lovable preview iframe, open the standalone presenter window first; when top-level, call `requestFullscreen` on the slide deck root. Keep the controller mounted while fullscreen is active.
10. Implement the fullscreen fix in the smallest possible diff: update `enterFullscreen` (or the controller action) so the embedded-first fallback runs before native fullscreen, and so the top-level path targets the slide deck root rather than the preview container.
11. Update / add tests in `SlidePresenterPage.keyboard.test.ts` and the fullscreen spec test to cover: embedded → opens presenter window; top-level → `requestFullscreen` called on `[data-slides-fullscreen-root]`; controller stays mounted.
12. Write the fullscreen RCA to `.lovable/memory/diagnostics/08-fullscreen-button-not-real-fullscreen-rca.md` covering: why the button only expanded within the preview, why the prior fix in plan 02 was not enough, how the embedded-vs-top-level branch must be tested. Append the same summary to `.lovable/issues/03-...` under `## RCA — fullscreen`.
13. Move `.lovable/plans/pending/02-present-fullscreen-preview-fix.md` → `completed/` (flip `Status:` to `completed`) only after step 11 tests pass, since this plan absorbs and finishes that pending plan.
14. Inventory the Settings drawer component and locate where `backgroundMode` / background color picker is rendered today — that is the insertion point for the new pickers. See ./subtasks/04-highlight-fullscreen-settings-llm-guide/04-settings-inventory.md.
15. Extend the settings store (and persisted shape) with `textColor` and `highlightColor` fields, defaulting to the current `--cream` / `--gold` tokens so existing decks render identically until the user changes them.
16. Add two color pickers to the Settings drawer ("Slide text color", "Highlight color") next to the existing background color picker, using the same control style. Wire change events into the settings store.
17. In `RenderSlide.tsx` `ThemeWrap`, when `settings.textColor` is set override `--slide-fg` (or the equivalent token) inline; when `settings.highlightColor` is set override the `.hl` background token inline. Mirror the existing `backgroundMode === "color"` override pattern from decision `03-settings-background-color`.
18. Add a settings test that sets text + highlight colors and asserts the inline CSS vars on the slide root + the computed style on a `.hl` span change accordingly.
19. Create `.lovable/memory/decisions/05-settings-text-and-highlight-color.md` documenting the new override contract (which CSS var, which scope, persistence key) so future AI does not regress it.
20. Design the "Guide" submenu in Settings: a new section with three download buttons — "Download LLM guide (zip)", "Download theme guide (zip)", "Download slide JSON guide (zip)" — plus a single "Download all guides (zip)" action. See ./subtasks/04-highlight-fullscreen-settings-llm-guide/05-guide-menu-design.md.
21. Add a client-side zip builder utility under `src/lib/slides/guide-zip.ts` using a Worker-compatible zip library (e.g. `fflate`) — do NOT introduce Node-only deps. Bundle the static spec files as Vite `?raw` imports so they are inlined at build time.
22. Wire each download button to the zip builder: LLM guide bundles `docs/slides/spec/llm-json-guideline.md` + `docs/slides/spec/sample-deck.json` + `slides/README-LLM.md`; theme guide bundles `spec/old-slides/21-slides-system/07-theme-system.md` + relevant theme tokens; slide JSON guide bundles `docs/slides/spec/*.spec.md` + `src/lib/slides/schema.ts` exported JSON schema.
23. Add a test for the zip builder that asserts the produced blob is a valid zip and contains the expected file entries (names + non-empty bodies).
24. Add the "Guide" section to the Settings drawer UI under a clearly labelled heading with a one-line description ("Download authoring guides to feed any LLM so it can edit this deck."). Keep visual weight subordinate to existing settings; no new design tokens.
25. Update `.lovable/memory/features/` with a new entry `03-settings-guide-downloads.md` describing the guide menu contract (what each zip contains, what file the zip is built by, what version stamp is included) so the contents stay in sync with the spec.
26. Run the full focused test set: highlight rendering, fullscreen embedded + top-level, settings color overrides, guide zip builder. Capture pass/fail in the verification log.
27. Manually verify in the live preview: open `/slides/1`, confirm yellow highlight is visible on a known highlighted keyword; click fullscreen → goes true fullscreen (or opens presenter window when embedded); open Settings → change text color + highlight color and confirm the slide updates live; open Settings → Guide → download each zip and confirm the file lands.
28. Update `CHANGELOG.md` with a single entry summarising: highlight visibility fix, fullscreen embedded-vs-top-level fix, new text + highlight color pickers, new Guide download menu. Bump `package.json` version and pin in `README.md` per existing bookkeeping pattern.
29. Save this prompt verbatim to `.lovable/prompts/09-next-task.md` (next free sequence) per the existing prompts archive convention.
30. Move this plan to `.lovable/plans/completed/04-highlight-fullscreen-settings-llm-guide.md` and flip `Status:` to `completed`. Confirm `pending/02-present-fullscreen-preview-fix.md` was already moved in step 13 and is not duplicated.

## Verification

- Focused unit/component tests for `.hl` rendering (step 5), fullscreen branching (step 11), settings color overrides (step 18), and guide zip builder (step 23) all pass.
- Live preview verification per step 27 (highlight visible, fullscreen real, settings live-updates, zip downloads land).
- `.lovable/memory/diagnostics/07-...` and `08-...` exist with RCAs, and the same summaries appear in `.lovable/issues/03-...`.
- No browser console errors after any of the above interactions.
- `.lovable/plans/pending/` no longer contains `02-present-fullscreen-preview-fix.md` or this plan after step 30.

## Appended from prior pending tasks

- `.lovable/plans/pending/01-slides-first-preview.md` — slides-first preview + controller/launcher alignment remains pending; not absorbed by this plan.
- `.lovable/plans/pending/02-present-fullscreen-preview-fix.md` — absorbed by steps 8-13 of this plan and will be moved to `completed/` in step 13.
- `.lovable/plans/subtasks/01-slides-first-preview/01-rca-root-landing.md` — pending; not in scope here.
- `.lovable/plans/subtasks/01-slides-first-preview/02-ia-decision.md` — pending; not in scope here.
- `.lovable/plans/subtasks/01-slides-first-preview/04-launcher-visual-contract.md` — pending; not in scope here.
- `.lovable/plans/subtasks/01-slides-first-preview/05-controller-coexistence.md` — pending; not in scope here.
