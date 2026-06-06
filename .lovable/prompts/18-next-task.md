# 18 — Next task

## Read first
- `docs/slides/spec/present-fullscreen.spec.md` (now current as of 1.37.0).
- `src/components/slides/controls/ControllerOverflowMenu.tsx` — "Open in new window" wired.
- `src/components/slides/useFullscreen.ts` — embedded branch stays in `mode: "app"`.

## Root cause notes (for the next agent)
Issue 014's full lifecycle: 1.34 inverted the embedded branch, 1.35 added `Shift+W`, 1.36 was triage, 1.37 added the visible overflow item + refreshed the spec. The fullscreen contract is now documented end-to-end — do NOT re-introduce auto-popup on F.

## Next 2 steps

### Step 1 — Memory entry for the present/fullscreen contract
- **Reasoning:** Memory `mem://features/slides-motion-and-focus` covers F-key focus editor mount points but nothing covers the embedded-vs-top-level fullscreen decision. Without a memory entry the next agent re-reads `useFullscreen.ts` from scratch and is one bad heuristic away from re-introducing auto-popup.
- **Time:** 15–20 min. Add `mem://features/present-fullscreen` summarizing: 3 modes, "no auto-popup on F" invariant, single popup path (Shift+W + overflow item), spec/test pointers. Update `mem://index.md`.
- **Unblocks:** Future fullscreen changes start from the contract, not the source.

### Step 2 — Extract `handleDownloadGuide` from `SettingsDrawer.tsx`
- **Reasoning:** `llm-guide-zip.test.ts` (1.33) covers the raw imports and zip round-trip, but the click→download wiring inside `SettingsDrawer.handleDownloadGuide` (lines 147–174) has no test. A silent `toast.error` is still possible if the click handler regresses (wrong filename, missing `URL.revokeObjectURL`, etc.). Extracting into a pure helper makes it directly testable.
- **Time:** 30–45 min. Create `src/components/slides/llm-guide-download.ts` (or similar) exporting `buildLlmGuideZip()` and `triggerDownload(blob, filename)`. Refactor `SettingsDrawer` to call them. Add test that asserts both are called from a single `handleDownloadGuide` shim.
- **Unblocks:** Closes the only remaining optional from prompt 17's backlog; SettingsDrawer becomes thinner.

## Remaining backlog (after these 2)
- Optional: `spec/settings-drawer.md` if any section grows sub-behavior.
- Optional: revisit `DeckLauncher` / `SlidesHomeShell` if a launcher UI is ever requested (currently dropped per plan 01).

## Bookkeeping done this turn
- Version 1.36.0 → **1.37.0** (`package.json`, `README.md`, `CHANGELOG.md`).
- `docs/slides/spec/present-fullscreen.spec.md` rewritten for the post-1.35 contract.
- `ControllerOverflowMenu.tsx` adds "Open in new window"; test green (3/3).
- Prompt saved as `.lovable/prompts/18-next-task.md`.
