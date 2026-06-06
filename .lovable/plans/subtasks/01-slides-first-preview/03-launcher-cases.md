# Subtask 03 — Launcher cases inventory

**Parent:** 01-slides-first-preview
**Slug:** launcher-cases
**Status:** pending
**Created:** 2026-06-06

## To be filled during step 9

Table columns: Case | Spec citation | Target route or action | Current
support | Notes.

Cases expected (confirm against spec folders during Step 9):

- Present (fullscreen, current window) — controller-2026 spec.
- Present in new window — `home-present.ts`,
  `openHomePresenterWindow`.
- Inspector / Speaker view — `/slides/inspector/1`,
  `mem://features/presenter-inspector`.
- Handout — `/slides/handout`.
- Handout 3-up — `/slides/handout-3up`.
- Print — `/slides/print`.
- Audience link — `/audience/$sessionId` (generate session id).
- Import deck (JSON) — existing `io.ts` pickJsonFile.
- Export deck (JSON) — existing `io.ts` exportDeck.
- Settings — opens SettingsDrawer.
- Reset cached deck (dev-only) — `devResetCachedDeck`.

Each row MUST cite a spec file before shipping the button.
