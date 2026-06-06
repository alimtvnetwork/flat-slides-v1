# 11 — Next Task

Verbatim "Next N Steps v5" prompt (N=2). This turn executed: fix pre-existing `shortcuts.test.ts` failure + add defensive guard.

- Root cause (one sentence): `shortcuts.test.ts` looked up SHORTCUT entries by brittle `display` strings ("F", "G") that were renamed (to "F / F5") so `find` returned `undefined`, and `matchesShortcut` had no guard against an undefined `def`, so it crashed silently with "Cannot read properties of undefined (reading 'keys')" — masking any other shortcut regression.
- Fix: defensive `if (!def?.keys) return false` in `shortcuts.ts:128–140`; tests look up by stable `id` (`fullscreen-toggle`) + new regression test for the undefined case. 5/5 green.
- Bumped 1.29.0 → 1.30.0, README pinned, CHANGELOG entry added.

Next: RCA write-ups → `07-highlight-invisible-rca.md`, `08-fullscreen-presenter-window-rca.md`; `.hl` background regression test; move plan 02 → completed.
