# Subtask 01 — `.hl` emission trace

**Slug:** hl-emission-trace
**Status:** pending
**Created:** 2026-06-06
**Parent:** 04-highlight-fullscreen-settings-llm-guide

## Scope

Confirm whether highlighted keywords in the active deck actually emit `<span class="hl">` at runtime, or whether the highlight path is being stripped somewhere between deck JSON → schema → RichText renderer.

## Checks

- Read `src/lib/slides/io-mark-highlights.test.ts` and the matching `markHighlights` implementation; confirm the input shape it expects vs what the active deck produces.
- Read the RichText / slide renderer that consumes highlighted segments and confirm it emits `className="hl"` (not `hl-pill`, not a styled component that drops the class).
- Open the active deck JSON and pick one keyword that should be highlighted; trace it through `io.ts` → schema → renderer in a unit-style scratch test.
- Inspect a slide in the preview and verify the DOM has `<span class="hl">` for the expected word. If the class is missing, the bug is upstream of CSS.

## Output

Document the exact node in the pipeline that drops or never emits `.hl`. That single line is what step 4 of the parent plan must fix.
