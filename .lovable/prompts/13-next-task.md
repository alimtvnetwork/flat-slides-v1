# 13 — Next task

## Done in this turn (v1.32.0)

**Root cause (one sentence):** The plan board still listed issue-03 work under `pending/` and there was no written confirmation that `SettingsDrawer.tsx` still matches the only spec covering it (`spec/old-slides/27-slides-number/10-visibility-and-settings.md`), so the next AI would either re-pick closed work or quietly drift the drawer.

**Fix (minimum correct change):**
- `mv .lovable/plans/pending/04-highlight-fullscreen-settings-llm-guide.md .lovable/plans/completed/`.
- Wrote `spec/audits/27-settings-drawer-audit.md` — inventory of 13 drawer sections with line numbers, §10 parity table (all three toggles present at lines 354/358/362), and a "ship as-is" recommendation.

**Verification:** Drawer section labels grepped directly from `SettingsDrawer.tsx` (lines 197, 225, 273, 304, 335, 350, 371, 427, 435, 446, 474, 496, 581, 606); spec §10 toggles confirmed at lines 354, 358, 362. No code change needed → no test run required.

---

## Next 2 Steps

### Step 1 — Close `spec/issues/014-preview-fullscreen-breaks-out-of-iframe.md` and cross-link RCA 08
- **Reasoning:** RCA 08 documents the fix contract (presenter-window path inside the iframe, no `requestFullscreen` from `window.top !== window.self`). The spec issue is the user-visible tracker; leaving it open while the fix shipped 2 versions ago is exactly the "lying status board" problem we just cleared from `pending/`.
- **Time:** 10–15 min. Read issue 014, append a "Resolved in v1.30/1.31" status block linking RCA 08, mark closed.
- **Unblocks:** The remaining `spec/issues/` count reflects real open bugs again, so the next bug-fix pick is honest.

### Step 2 — Smoke test the LLM-guide ZIP download end-to-end in preview
- **Reasoning:** The download landed in v1.29.0 with zero automated coverage — only the handler exists. If `fflate.zipSync` or the `?raw` imports fail at runtime (Worker bundling can drop dynamic imports), the user gets a silent toast.error and no zip. Silent failure is what the prompt's "Error logs & error management" rule explicitly forbids.
- **Time:** 30–45 min. Open `/slides/1`, open Settings → LLM guide → Download, confirm `glasswing-llm-guide.zip` downloads, unzip and verify it contains `llm-json-guideline.md` + `sample-deck.json` + a README. If broken, fix and add a unit test that calls `handleDownloadGuide` against a mocked Blob to assert the entry list.
- **Unblocks:** Closes the last loose end from issue 03 with proof-of-life signal, not just code-landed signal.

---

## Full remaining backlog

- Close spec issue 014 (Step 1).
- Smoke-test LLM-guide ZIP (Step 2).
- Verify annotation persistence flag still honored after recent drawer additions (mem://features/slides-motion-and-focus).
- Optional: write `spec/settings-drawer.md` if any net-new drawer section grows sub-behavior (per audit recommendation).
- Plan 02 (`02-present-fullscreen-preview-fix.md`) still in `pending/` — re-evaluate after Step 1; likely also done.
