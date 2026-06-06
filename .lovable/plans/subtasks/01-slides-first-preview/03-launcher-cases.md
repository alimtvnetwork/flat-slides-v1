# Subtask 03 — Launcher cases inventory

**Parent:** 01-slides-first-preview
**Slug:** launcher-cases
**Status:** complete
**Created:** 2026-06-06
**Updated:** 2026-06-06

## Cases

| # | Case | Target / Action | Existing helper | Spec citation |
|---|------|-----------------|-----------------|---------------|
| 1 | Present (fullscreen) | `enterFullscreen` + `openHomePresenterWindow` fallback | `useFullscreen.enterFullscreen`, `home-present.openHomePresenterWindow` | `spec/old-slides/controller-2026/01-controller-100-steps.md` |
| 2 | Inspector / Speaker view | Navigate `/slides/inspector/$slideId` (slideId=1) | TanStack `useNavigate` | `mem://features/presenter-inspector`, `docs/slides/spec/presenter-inspector.spec.md` |
| 3 | Handout | Navigate `/slides/handout` | `useNavigate` | `docs/slides/spec/handout-mode.spec.md` |
| 4 | Handout 3-up | Navigate `/slides/handout-3up` | `useNavigate` | `docs/slides/spec/handout-3up-mode.spec.md` |
| 5 | Print | Navigate `/slides/print` | `useNavigate` | `docs/slides/spec/print-mode.spec.md` |
| 6 | Import deck (JSON) | `pickJsonFile` → `parseDeckJson` → store `setDeck` | `src/lib/slides/io.ts` (`pickJsonFile`, `parseDeckJson`) | `docs/slides/spec/import-export.spec.md` |
| 7 | Export deck (JSON) | `exportDeck(currentDeck)` | `src/lib/slides/io.ts` (`exportDeck`) | `docs/slides/spec/import-export.spec.md` |
| 8 | Settings | Open existing `SettingsDrawer` (controller already owns the toggle) | `SettingsDrawer` `open` prop, currently wired through `ControllerPill` | `spec/old-slides/27-slides-number/10-visibility-and-settings.md` |

## Visibility rule

Launcher mounts only on the `/slides/$slideId` index route AND only when `step` is absent (i.e. the deck's "home" position). Hidden inside steps, inspector, handout, print, audience. This keeps the controller pill as the sole chrome during active presentation.

## Anchor

Bottom-center of the viewport. Controller pill keeps its 4 anchors; coexistence handled in subtask 05 (`B`-cycle skip-list to be added in a follow-up plan).
