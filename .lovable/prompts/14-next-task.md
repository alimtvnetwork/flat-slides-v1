# 14 — Next task

## Done in this turn (v1.33.0)

**Root cause (one sentence):** The LLM-guide download had zero test coverage so a Vite `?raw` resolution drop would silently break it, and the previous turn falsely claimed spec issue 014 was closed when `useFullscreen.ts:152–161` still does popup-first (which IS the symptom 014 reports).

**Fix (minimum correct change):**
- New `src/components/slides/llm-guide-zip.test.ts` (3 cases) covering raw-import resolution, JSON parse, and `fflate` round-trip with the three expected zip entries.
- Reopened spec issue 014 with a status-log entry naming the exact lines that contradict its fix plan and the real next action (invert embedded branch + rewrite `fullscreenTarget.test.ts:65–86`).
- Removed the false "Closes 014" line from `.lovable/issues/03-...md`.

**Verification:** `bunx vitest run src/components/slides/llm-guide-zip.test.ts` → 3/3 green.

---

## Next 2 Steps

### Step 1 — Actually fix spec issue 014: prefer in-iframe modal in embedded preview
- **Reasoning:** This is the real "breaking out of preview" bug the user keeps hitting. The current popup-first path is the symptom. Skipping it again means another loop of "looks fixed in CHANGELOG, still broken in preview".
- **Time:** 60–90 min. In `useFullscreen.ts` embedded branch, keep `setAppPresentationMode(true)` and return `{ ok: true, mode: "app" }`. Add an explicit "Open in new window" affordance somewhere in the controller pill that calls `openPresenterWindow()` on a real user click. Rewrite `fullscreenTarget.test.ts:65–86` to assert the new contract: embedded + no explicit popup intent → app mode, no `window.open` call. Update `spec/issues/014` + `docs/slides/spec/present-fullscreen.spec.md` §6 in the same change.
- **Unblocks:** Closes 014 honestly; the preview Present flow stops feeling like a tab escape.

### Step 2 — Annotation persistence flag regression check (mem://features/slides-motion-and-focus)
- **Reasoning:** Drawer has had 4 new sections added since the flag was last verified; settings-drawer parity audit (v1.32.0) explicitly listed this as a follow-up. If the flag is silently off, focus-editor edits are lost on reload — invisible data loss.
- **Time:** 30–45 min. Locate the persistence flag (likely in `annotations-store.ts` or `settingsPersistence.ts`), write a vitest that mounts the store, sets an annotation, simulates a reload via `localStorage` round-trip, and asserts the annotation survives. If broken, fix in the same change.
- **Unblocks:** Removes the last open follow-up from the v1.32.0 audit; clears the way for `spec/settings-drawer.md` if any new section grows sub-behavior.

---

## Full remaining backlog

- Spec issue 014 real fix (Step 1).
- Annotation persistence regression test (Step 2).
- Plan `02-present-fullscreen-preview-fix.md` still in `pending/` — close or merge with 014 after Step 1.
- Optional: write `spec/settings-drawer.md` if any drawer section grows sub-behavior.
