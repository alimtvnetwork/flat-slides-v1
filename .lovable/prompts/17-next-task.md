# 17 — Next task

## Read first
- `src/components/slides/controls/ControllerPill.tsx`, `ControllerOverflowMenu.tsx` — anchor / overflow rendering.
- `src/components/slides/shortcuts.ts:102` (`present-window`) and `presenterActions.ts:134` (handler) — wiring already exists.
- `src/components/slides/useFullscreen.ts:61` `openPresenterWindow()` — what the button will call.
- `docs/slides/spec/present-fullscreen.spec.md` (if present) — keep in sync.

## Root cause of the remaining gap (one sentence)
`Shift+W` exists as a keyboard-only path to the popup; `ControllerOverflowMenu` does NOT expose a click-to-open-in-new-window item, so mouse-only / touch users have no discoverable way to leave the in-iframe presenter.

## Next 2 steps

### Step 1 — Add "Open in new window" item to ControllerOverflowMenu
- **Reasoning:** F now stays in-iframe (1.34.0); `Shift+W` is keyboard-only (1.35.0). Without a visible menu item the popup path is undiscoverable for non-keyboard users, leaving issue 014's UX promise half-shipped. Dispatch via the existing `present-window` shortcut id so the keymap stays the single source of truth (parity test will catch drift).
- **Time:** 30–45 min including a render test that the item exists, calls `dispatchShortcut("present-window")` (or equivalent), and is hidden when `!isEmbeddedWindow()` (top-level windows don't need a popup affordance).
- **Unblocks:** Closing the final UX item from issue 014; lets `docs/slides/spec/present-fullscreen.spec.md` §6 cite a concrete UI surface, not just a shortcut.

### Step 2 — Write `docs/slides/spec/present-fullscreen.spec.md`
- **Reasoning:** The fullscreen contract has shifted twice (1.34, 1.35) and now has three modes (top-level native, embedded app, explicit Shift+W popup). Without a forward-facing spec the next agent will re-litigate the embedded branch and likely re-introduce auto-popup. Memory `mem://bugs/slides-routing` covers routing but nothing covers fullscreen.
- **Time:** 40–60 min. Cover: 3 cases (top-level → native FS API; embedded → `setAppPresentationMode(true)`; explicit `Shift+W`/overflow → `openPresenterWindow()`); invariants (no auto-popup on F, `data-slides-app-presenting` attribute ownership, `reportFullscreenFailure({ reason: "embedded-popup-blocked" })` on popup block); test pointers (`fullscreenTarget.test.ts`, new overflow test).
- **Unblocks:** Future agents change behavior intentionally, not accidentally; gives reviewers a single doc to diff against PRs touching `useFullscreen.ts`.

## Remaining backlog (after these 2)
- Optional: `spec/settings-drawer.md` if any drawer section grows sub-behavior.
- Optional: extract `handleDownloadGuide` from `SettingsDrawer.tsx` for a component-level click→download test.
- Optional: add a memory entry once fullscreen spec lands (`mem://features/present-fullscreen`).

## Bookkeeping done this turn
- Version 1.35.0 → 1.36.0 (`package.json`, `README.md`, `CHANGELOG.md`).
- Prompt saved as `.lovable/prompts/17-next-task.md`.
- No code change — planning-only turn (honest report, no fake fix).
