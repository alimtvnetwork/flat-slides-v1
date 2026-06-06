# 16 — Next task

## Done in this turn (v1.35.0)

**Root cause (one sentence):** After v1.34.0 removed the auto-popup from F, there was no UI/keyboard path left to reach a real top-level presenter window — `openPresenterWindow()` was exported but unreachable from user input — and the last `pending/` plan (01) was a stale 30-step spec gate that had already been superseded by piecemeal landings.

**Fix (minimum correct changes):**
- New `present-window` shortcut bound to `Shift+W` (`shortcuts.ts:95`) with a registered action (`presenterActions.ts:128–135`) that calls `openPresenterWindow()` and surfaces `embedded-popup-blocked` via `reportFullscreenFailure` when the popup is blocked.
- Closed plan 01 with a status block enumerating what landed vs what was intentionally dropped (`DeckLauncher`, `SlidesHomeShell`, `featureFlags.ts`); moved file to `completed/`. `pending/` is now empty.

**Verification:** `bunx vitest run src/components/slides/presenterActions.test.ts src/components/slides/shortcuts.test.ts` → 13/13 green (parity test enforces SHORTCUTS↔action coverage for the new id).

---

## Next 2 Steps

### Step 1 — Add a visible "Open in new window" button in the controller overflow menu
- **Reasoning:** Shift+W works but is undiscoverable for non-keyboard users. The controller overflow already hosts presenter-only actions (per `mem://features/presenter-controller-pill`); adding the affordance there is the lowest-cost path to discoverability and matches the same UX as `open-inspector`.
- **Time:** 30–45 min. Add a menu item in `ControllerPill.tsx` overflow that dispatches the `present-window` action (or directly calls `openPresenterWindow()` + the same error toast path). Add a smoke test in the existing controller test asserting the button is present and click triggers `openPresenterWindow`.
- **Unblocks:** Removes the last "feature exists only via keyboard" gap from issue 014; closes the loop fully.

### Step 2 — Source-of-truth doc: `docs/slides/spec/present-fullscreen.spec.md`
- **Reasoning:** The fullscreen contract now spans 3 cases (top-level → native, embedded → app mode, explicit Shift+W → popup) with subtle invariants (no auto-popup, `setAppPresentationMode` ownership, `data-slides-app-presenting` attribute). RCAs 06/08 + issue 014 status logs describe how we got here, but there is no single forward-facing spec a contributor (or LLM) can read first. Without it, the popup-first regression WILL come back.
- **Time:** 40–60 min. Write the spec with one section per case + acceptance bullets that map 1:1 to `fullscreenTarget.test.ts` cases. Link from `mem://features/slides-motion-and-focus` index.
- **Unblocks:** Future audits can diff the doc against the test file in seconds.

---

## Full remaining backlog

- Overflow-menu "Open in new window" button (Step 1).
- `docs/slides/spec/present-fullscreen.spec.md` source-of-truth (Step 2).
- Optional: write `spec/settings-drawer.md` if any drawer section grows sub-behavior.
- Optional: extract `handleDownloadGuide` from `SettingsDrawer.tsx` for component-level click→download coverage.
