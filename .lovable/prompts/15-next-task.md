# 15 — Next task

## Done in this turn (v1.34.0)

**Root cause (one sentence):** `src/components/slides/useFullscreen.ts:148–161` auto-spawned a top-level popup on every F-press when embedded — that popup IS the "preview breaking out" symptom spec issue 014 reported, and there was no test pinning the annotation persistence partialize contract.

**Fix (minimum correct changes):**
- Inverted the embedded branch in `useFullscreen.ts` to stay in app-presentation mode (`mode: "app"`); kept `openPresenterWindow()` available for an explicit user-initiated popup.
- Rewrote 3 legacy cases in `fullscreenTarget.test.ts` to assert the new contract (no `window.open`, no `requestFullscreen`, `data-slides-app-presenting` set).
- New `annotations-persistence.test.ts` (2/2) covers both branches of `annotations-store.ts:104` partialize.
- Closed `spec/issues/014` with a status-log entry naming the changed lines; moved `.lovable/plans/pending/02-present-fullscreen-preview-fix.md` → `completed/`.

**Verification:** `bunx vitest run src/components/slides/fullscreenTarget.test.ts` → 12/12; `bunx vitest run src/components/slides/annotations-persistence.test.ts` → 2/2.

---

## Next 2 Steps

### Step 1 — Add an explicit "Open in new window" affordance in the controller pill
- **Reasoning:** Now that F stays in-iframe, presenters who genuinely want a separate window have no UI to get one. `openPresenterWindow()` is exported but unused from UI. Without this, the popup path is dead code and we just removed a (clumsy) feature without offering the proper replacement.
- **Time:** 30–45 min. Add a new SHORTCUTS entry (e.g. `present-window`, key `Shift+F`) + a matching `PRESENTER_KEY_ACTIONS` handler that calls `openPresenterWindow()`. Add a button in the controller overflow menu. Parity test in `presenterActions.test.ts` already enforces SHORTCUTS↔actions coverage, so it will fail fast if either side is missing. Update `mem://features/presenter-controller-pill`.
- **Unblocks:** Closes the loop on issue 014 by giving users both paths (in-iframe by default, popup on explicit intent). Removes "dead export" warning vector around `openPresenterWindow`.

### Step 2 — Plan `01-slides-first-preview.md` triage
- **Reasoning:** Only plan left in `pending/`. Memory Core already says "Root `/` redirects to `/slides/1`", suggesting the plan landed. Either close it or list its real remaining scope so `pending/` reflects reality.
- **Time:** 15–20 min. Read the plan, diff against `src/routes/index.tsx` redirect behavior, close or list outstanding subtasks in a status log.
- **Unblocks:** Empty `pending/` folder → next-task selection is purely from `spec/issues/`, which is the canonical bug source.

---

## Full remaining backlog

- "Open in new window" UI affordance (Step 1).
- Triage `01-slides-first-preview.md` (Step 2).
- Optional: write `spec/settings-drawer.md` if any drawer section grows sub-behavior.
- Optional: extract `handleDownloadGuide` from `SettingsDrawer.tsx` so a component-level test can assert the click→download wiring (today's coverage stops at the data path).
