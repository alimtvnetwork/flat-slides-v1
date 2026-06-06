# Subtask 03 — Fullscreen action trace

**Slug:** fullscreen-trace
**Status:** pending
**Created:** 2026-06-06
**Parent:** 04-highlight-fullscreen-settings-llm-guide

## Scope

Trace the controller fullscreen button end-to-end to confirm why it currently only expands within the embedded preview frame instead of entering the browser Fullscreen API.

## Checks

- Locate the fullscreen action in `presenterActions.ts` (SHORTCUTS id for `F` / fullscreen button).
- Read `enterFullscreen` helper: what target element does it call `requestFullscreen` on?
- Read `docs/slides/fullscreen-present-fallback.spec.md` and `.lovable/memory/diagnostics/06-present-fullscreen-preview-rca.md` for the embedded-vs-top-level contract.
- Detect embedded context: `window.self !== window.top`. When embedded, open the standalone presenter window (per RCA 06) instead of `requestFullscreen` — the lovable preview iframe blocks fullscreen.
- When top-level, `requestFullscreen` MUST target `[data-slides-fullscreen-root]` (see `src/routes/slides.tsx`), not the controller pill or the document element.

## Output

A single decision: which branch handles which context, and exactly which element receives the fullscreen request. Step 10 of the parent plan implements this.
