# 07 — Next Task

Verbatim user prompt (v5 "Next N Steps" template) requesting N=2 next steps with reasoning / time / unblocks, then the full remaining backlog, then version bump + changelog + README pin + save this prompt as `.lovable/prompts/07-next-task.md`.

Outcome of this turn:
- Root cause fix for invisible yellow highlighter: `src/styles.css` `.hl` now has yellow background + dark ink (was text-only, invisible on light themes).
- Bumped to 1.26.0, README pinned, CHANGELOG entry under `## 1.26.0 — 2026-06-06`.
- Next 2 steps queued: (1) fix fullscreen for embedded preview (open top-level presenter window instead of in-iframe `position:fixed` cover); (2) add Text-color + Highlight-color pickers to SettingsDrawer + wire `--slide-hl` override.
