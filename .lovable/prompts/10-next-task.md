# 10 — Next Task

Verbatim "Next N Steps v5" prompt (N=2). This turn executed: Guide download in Settings.

- Root cause (gap, not bug): the LLM JSON spec existed in `docs/slides/spec/` but was invisible to non-developers; user wanted a downloadable guide so anyone can produce decks.
- Fix: dynamic-imported `fflate.zipSync`, raw-imported `llm-json-guideline.md` + `sample-deck.json`, added "LLM guide" section in `SettingsDrawer.tsx` with a single Download button that ships `glasswing-llm-guide.zip` (README + spec + sample). Errors surface via `toast.error` + `console.error`.
- Tests: full `src/components/slides/` suite — 389/390 green. The 1 failure (`shortcuts.test.ts > is case-insensitive on letter keys`) is pre-existing and unrelated (no SHORTCUT defines `display:"F"`; the test crashes on `def.keys` because `find` returns undefined).
- Bumped 1.28.0 → 1.29.0, README pinned, CHANGELOG entry added.

Next: RCA write-ups + `.hl` background regression test + spec-parity audit; also fix the pre-existing `shortcuts.test.ts` F-key test.
