# 12 — Next task

## Done in this turn (v1.31.0)

**Root cause (one sentence):** Issue 03 was missing durable RCA files and a `.hl background-color` regression test, so a future AI could silently reintroduce the invisible-highlight bug (shorthand `background:` losing the cascade) and the preview-iframe fullscreen-cover bug.

**Fix (minimum correct change):**
- Wrote `.lovable/memory/diagnostics/07-highlight-invisible-rca.md` and `08-fullscreen-presenter-window-rca.md` with one-sentence root cause + "do not regress" sections.
- Added a third case to `src/components/slides/highlight-style-guardrails.test.ts` that asserts `.hl` declares `background-color: var(--slide-hl)` and `--slide-hl` is non-transparent.
- Appended a closed status summary to `.lovable/issues/03-highlight-fullscreen-settings-and-llm-guide.md`.

**Verification:** `bunx vitest run src/components/slides/highlight-style-guardrails.test.ts` → 3/3 green (was 2/2).

---

## Next 2 Steps

### Step 1 — Move plans 03 and 04 to `completed/`, archive old prompts
- **Reasoning:** Issue 03 is closed (v1.31.0) but the plan folder still lists it under `pending/`. Leaving closed work in `pending/` makes the planning surface lie about what is in-flight; the next AI will re-pick already-fixed items.
- **Time:** 15 min.
- **Unblocks:** Clean `pending/` board so the next task pick is honest (likely SettingsDrawer parity audit vs `27-slides-number`).

### Step 2 — SettingsDrawer parity audit vs `spec/27-slides-number-spec.md`
- **Reasoning:** Settings now has 4 new sections (theme, bg color, text color, hl color, LLM guide). Spec 27 lists the canonical drawer sections + order. Drift here will show up as missing/duplicated controls in user reports.
- **Time:** 45–60 min. Read spec 27, diff against `SettingsDrawer.tsx`, write `spec/audits/27-settings-drawer-audit.md` listing matches / extras / gaps.
- **Unblocks:** Either a small follow-up patch (reorder/rename) or a confident "ship as-is" sign-off; either way the spec stops being a known-unknown.

---

## Full remaining backlog

- Plans 03 & 04 → `completed/` (Step 1).
- SettingsDrawer ↔ spec 27 parity audit (Step 2).
- Iframe fullscreen issue (`spec/issues/014`) — code path landed; mark spec issue closed and cross-link RCA 08.
- Annotation persistence flag (mem://features/slides-motion-and-focus) — verify still honored after recent drawer additions.
- LLM guide ZIP: smoke test the actual download in preview (no automated coverage today).
