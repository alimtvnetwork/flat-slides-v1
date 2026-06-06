# Subtask 02 — Highlight RCA write-up

**Slug:** highlight-rca
**Status:** pending
**Created:** 2026-06-06
**Parent:** 04-highlight-fullscreen-settings-llm-guide

## Scope

Write the durable RCA for why the yellow highlight was invisible on slides, so any future AI editing this deck does not repeat the mistake.

## Required sections

1. **Symptom (verbatim)** — quote the user.
2. **Root cause (one sentence)** — pinpoint the single broken node: missing emission, overridden token, or transparent background.
3. **Why it was missed** — which test or spec failed to catch it (e.g. `.hl` test only checked text-shadow, not background-color).
4. **Fix** — exact file + line range changed.
5. **Lock** — the regression test added in step 5 of the parent plan; reference it by file path.
6. **Future-AI directive** — one paragraph: "When changing `.hl` styling or RichText rendering, you MUST also verify the computed `background-color` is a non-transparent yellow — text-shadow alone is not the highlight."

## Output paths

- `.lovable/memory/diagnostics/07-highlight-invisible-rca.md` (durable memory)
- Append the same summary to `.lovable/issues/03-highlight-fullscreen-settings-and-llm-guide.md` under `## RCA — highlight`.
