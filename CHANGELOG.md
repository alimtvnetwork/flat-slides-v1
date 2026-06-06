# Changelog

All notable changes to Glasswing are documented in this file.

## 1.45.0 — 2026-06-06

### Closed
- **Plan 05 → completed.** Moved `.lovable/plans/pending/05-controller-whitebal-fonts.md` → `.lovable/plans/completed/05-…md` with `Status: completed` + closure note. SS-01 (back-step nav) was already correct (verified 1.41.0); SS-03 (font antialiasing + Ubuntu Bold) shipped in 1.41.0 + 1.44.0; SS-02 (white-balance-in-controller) deferred into plan 06 Phase C — `grep -rn "whitebal" src/` returns zero hits, so SS-02 is properly a build-from-scratch task that belongs with plan 06's controller work, not a "move existing slider" task in plan 05.

### Planning
- **Next-task triage (prompt 26).** Next 3 steps: (1) plan 06 typography addendum locking the Ubuntu-everywhere rule + memory index Core line, (2) plan 06 ellipsis-pagination + threshold spec under `spec/old-slides/27-slides-number/03-ellipsis-pagination.md`, (3) Vitest computed-style snapshot test pinning Ubuntu Bold on hero `<h1>` so Phase D's 35 new type renderers cannot silently regress the 1.44.0 fix.

## 1.44.0 — 2026-06-06

### Fixed
- **Ubuntu Bold on hero/title slide (issue 05).** Root cause: `RenderSlide.tsx:157` rendered the title `<h1>` with `.slide-display .slide-title-lg` + inline `fontWeight: 400`, and `.slide-title-lg` in `src/styles.css:230` also forced `font-weight: 400` without a `font-family` override — hero rendered Ubuntu Regular at 176px instead of Ubuntu Bold. Fix: `<h1>` now always uses `slide-heading` + inline `fontWeight: 700` on both `display` and non-display branches; `.slide-title-lg` now sets `font-weight: 700` and `font-family: var(--slide-font-heading)` defensively. Minimum correct change per issue 05 + command 05 + spec `10-typography.md` "Titles only 700".

### Planning
- **Next-task triage (prompt 25).** Next 3 steps: (1) close plan 05 SS-02 white-balance-in-controller, (2) plan 06 Phase A specs steps 4–10 (typography addendum + ellipsis spec + 35 stub type files + themes addendum + palette doc), (3) Phase A remainder 11–20 + computed-style snapshot test (plan 06 step 24) to lock the Ubuntu fix shipped above against regression when 35 new type renderers land in Phase D.

## 1.43.0 — 2026-06-06

### Planning
- **Next-task triage (prompt 24).** No product code change. Re-confirmed pinned next 3 steps for plan 06: (1) close plan 05 SS-02 white-balance-in-controller, (2) RCA Ubuntu regression on slide 1, (3) ship minimum-correct font fix with computed-style snapshot. Captured fresh code-level signal: `src/styles.css:226` `.slide-display` is Poppins/weight-400 (wrong for headings) while `.slide-heading` line 227 is correct Ubuntu/700 — likely root cause is title element using `.slide-display` or no font class at all (inheriting Poppins body from line 146). Controller surface confirmed: `ControllerPill.tsx` + `DotPagination.tsx` + `ControllerOverflowMenu.tsx` with parity test must stay green through SS-02.

## 1.42.0 — 2026-06-06

### Planning
- **Plan 06 opened + next-task triage (prompt 23).** No product code change. New plan `.lovable/plans/pending/06-slide-types-themes-llm-controller.md` (100 steps) + 4 subtasks covers: Ubuntu-headers regression (issue 05), 35 new slide types (image/SVG/GIF/video/Lottie/team/comparison/code/chart/etc.), 10 new themes seeded from `assets/samples/*`, slide-indicator ellipsis pagination (threshold default 15, configurable), and a full LLM JSON guideline rewrite with Teams section + in-launcher download. Captured commands 05–08 under `.lovable/spec/commands/`. Next 3 steps pinned: close plan 05 (SS-02 white-bal-in-controller), then RCA the Ubuntu regression on slide 1, then ship the minimum-correct font fix with a computed-style snapshot test.

## 1.41.0 — 2026-06-06

### Fixed
- **Heading anti-aliasing (SS-03).** `src/styles.css` body + `.slide-content` now set `-webkit-font-smoothing: antialiased`, `-moz-osx-font-smoothing: grayscale`, `text-rendering: optimizeLegibility`, and `font-feature-settings: "kern" 1, "liga" 1`. Ubuntu 400/500/700 were already loaded in `src/routes/__root.tsx:101` and `.slide-title`/`.slide-heading` already set `font-weight: 700` — root cause was missing glyph smoothing on the 1920×1080 scaled surface, which made 700-weight Ubuntu render as blurry sub-pixel text after CSS scaling. Now headings render crisp in fullscreen and at every scale.

### Verified
- **SS-01 symmetric back-step nav already correct.** `movePrevStepAware()` in `SlidePresenterPage.tsx:323-331` decrements `step` while `isStepRoute && stepNum > 0`, and `prev()` in `useSlideNavigation.ts:85-90` lands on the previous slide's `lastStep` via `slideStepCount`. No change needed; documented to close SS-01.

## 1.40.0 — 2026-06-06

### Planning
- **Next-task triage (prompt 21).** No product code change. Re-confirmed plan 05 pending; next 2 steps pinned to SS-01 (symmetric back-step nav: `SlidePresenterPage.tsx` `goPrev()` decrements slide directly, skipping `step` decrement on `steps`/`timeline` slides) and SS-03 (Ubuntu loaded only at 400 in `index.html`, `.slide-canvas` lacks `-webkit-font-smoothing` in `src/styles.css`, causing faux-bold blurry headings). Remaining: SS-02 white-bal-in-controller, parity/docs, e2e verification, plan closure.

## 1.39.0 — 2026-06-06

### Planning
- **Next-task triage (prompt 20).** No product code change. Read the active project memory and the source files for plan 05 before selecting work: `.lovable/coding-guidelines.md`, `.lovable/plan.md`, `.lovable/memory/index.md`, `.lovable/plans/pending/05-controller-whitebal-fonts.md`, `.lovable/issues/04-controller-whitebal-step-back-fonts.md`, `src/components/slides/SlidePresenterPage.tsx`, `src/components/slides/RenderSlide.tsx`, `src/styles.css`, and `src/components/slides/controls/ControllerPill.tsx`. Root cause: the active plan still has unresolved implementation work, so the correct next task output must be derived from the pending plan and source-level audit rather than inventing or reordering work. Next 2 implementation steps remain pinned to SS-01 symmetric back-step navigation, then SS-03 heading font weight + anti-aliasing; remaining plan items are SS-02 white-balance-in-controller, parity/doc updates if needed, end-to-end verification, and plan closure.

## 1.38.0 — 2026-06-06

### Planning
- **Next-task triage (prompt 19).** No code change. New plan `.lovable/plans/pending/05-controller-whitebal-fonts.md` (8 steps) + 3 subtasks covers user-reported regressions: back-step nav broken on `steps`/`timeline` slides, white-balance slider must live inside ControllerPill, headings render as blurry faux-bold (Ubuntu only loaded at 400, no `-webkit-font-smoothing`). Issue captured at `.lovable/issues/04-controller-whitebal-step-back-fonts.md`. Next 2 implementation steps pinned: SS-01 symmetric `goPrevStep()` then SS-03 font weight + antialiasing.

## 1.37.0 — 2026-06-06

### Added
- **"Open in new window" item in the controller overflow menu.** `src/components/slides/controls/ControllerOverflowMenu.tsx` now exposes a click affordance that calls `openPresenterWindow()` and surfaces `reportFullscreenFailure({ reason: "embedded-popup-blocked" })` on block — same contract as the `Shift+W` keyboard path. Closes the last UX gap from issue 014: mouse/touch users now have a discoverable path to the top-level presenter window.

### Docs
- **`docs/slides/spec/present-fullscreen.spec.md` rewritten.** Reflects the post-1.34/1.35 contract: F stays in-iframe (`mode: "app"`), popup is explicit via `Shift+W` or overflow item. Decision table updated, invariants section added (no auto-popup, single popup path, `data-slides-app-presenting` ownership), version history appended.

### Tests
- `ControllerOverflowMenu.test.tsx` 3/3 green — new case asserts the item is present in overflow and dispatches `window.open` with `_blank` when selected.

## 1.36.0 — 2026-06-06

### Planning
- **Next-task triage (prompt 17).** No code change. Confirmed remaining UI gap: `Shift+W` shortcut + action exist (`shortcuts.ts:102`, `presenterActions.ts:134`), but no visible "Open in new window" affordance in `ControllerPill` / `ControllerOverflowMenu` — keyboard-only users have a path, mouse-only users do not. Next implementation step pinned to that.

## 1.35.0 — 2026-06-06

### Added
- **`Shift+W` opens the presenter in a new top-level window.** Spec issue 014 follow-up: F now stays in-iframe; `Shift+W` is the explicit, user-initiated path to a top-level popup. New `present-window` entry in `src/components/slides/shortcuts.ts:95` + action in `src/components/slides/presenterActions.ts:128–135` calls `openPresenterWindow()` and surfaces `reportFullscreenFailure({ reason: "embedded-popup-blocked" })` when the popup is blocked. Auto-discovered by the keyboard-shortcuts help dialog (`?`).

### Docs
- **Plan 01 closed.** `.lovable/plans/pending/01-slides-first-preview.md` → `completed/` with a status block listing what landed (slides-first redirect, `/about`, diagnostics 03/04/05, SettingsDrawer audit, controller pill, issue 03 + 014 closures) and what was intentionally dropped (`DeckLauncher`, `SlidesHomeShell`, `featureFlags.ts` rollback). `pending/` is now empty.

### Tests
- `presenterActions.test.ts` parity test green (8/8) — the new `present-window` id has its action and is not in `MODIFIER_SHORTCUT_IDS`. `shortcuts.test.ts` (5/5) green.

## 1.34.0 — 2026-06-06

### Fixed
- **Spec issue 014 closed — preview no longer "breaks out" on F.** `src/components/slides/useFullscreen.ts:148–158` no longer auto-opens a top-level popup when `isEmbeddedWindow()`; it stays in the in-iframe app-presentation surface (`setAppPresentationMode(true)` + `mode: "app"`). `openPresenterWindow()` remains exported for an explicit "Open in new window" affordance. Root cause: the embedded branch popped a top-level window on every F press, which IS the "breakout" symptom users reported.
- **Plan 02 moved to `completed/`** (`.lovable/plans/pending/02-present-fullscreen-preview-fix.md` → `completed/`) — it tracked the same fix.

### Tests
- **`fullscreenTarget.test.ts` rewritten for the new contract** (12/12 green). Three legacy cases that locked in popup-first behavior were replaced with assertions that embedded enterFullscreen never calls `window.open` / `requestFullscreen` and sets `data-slides-app-presenting`.
- **Annotation persistence regression test.** New `src/components/slides/annotations-persistence.test.ts` (2/2 green) covers both branches of `annotations-store.ts:104` partialize: strokes stripped from storage when `persistStrokes=false`, strokes survive rehydrate when `persistStrokes=true`.

## 1.33.0 — 2026-06-06

### Tests
- **LLM-guide ZIP payload locked in tests.** New `src/components/slides/llm-guide-zip.test.ts` (3/3 green): asserts the `?raw` imports of `docs/slides/spec/llm-json-guideline.md` + `sample-deck.json` resolve to non-empty strings, that `sample-deck.json` parses as JSON, and that `fflate.zipSync`/`unzipSync` round-trips a zip with the three expected entries (`README.txt`, `llm-json-guideline.md`, `sample-deck.json`). If Vite ever drops `?raw` resolution for those paths, CI fails before a user can ever see the silent `toast.error` in `SettingsDrawer.handleDownloadGuide` (line 147–174).

### Corrected (honesty)
- **Spec issue 014 is NOT closed.** Audited `useFullscreen.ts:152–161` against the issue 014 fix plan: current code does popup-first when `isEmbeddedWindow()`, which IS the breakout symptom the issue describes. RCA 08 documented the popup contract but did not implement the requested in-iframe modal preference. Issue 014 status log updated with the real next action (invert the embedded branch, rewrite `fullscreenTarget.test.ts:65–86`). Issue 03's closing block reworded — it no longer claims to close 014.

## 1.32.0 — 2026-06-06

### Docs
- **Plan 04 moved to `completed/`.** `.lovable/plans/pending/04-highlight-fullscreen-settings-llm-guide.md` → `completed/`. Issue 03 is closed (v1.31.0), so leaving it under `pending/` was lying about in-flight work.
- **SettingsDrawer ↔ spec 27 parity audit.** New `spec/audits/27-settings-drawer-audit.md` inventories all 13 drawer sections, maps the three §10 visibility toggles (Presenter top bar / Slide number badge / Dot pagination) to their current lines in `SettingsDrawer.tsx`, and records net-new sections (Theme, Background, Text color, Highlight color, LLM guide, Camera, Darken, Blur, Transition, Music volume, Import/Export, Presenter tools, Dev). Result: no gaps, no duplicates, no conflicts — ship as-is.

## 1.31.0 — 2026-06-06

### Docs
- **RCAs for highlight + fullscreen issues.** Added `.lovable/memory/diagnostics/07-highlight-invisible-rca.md` (yellow `.hl` invisible on light themes — caused by shorthand `background:` losing the cascade; locked with regression test) and `.lovable/memory/diagnostics/08-fullscreen-presenter-window-rca.md` (preview iframe Fullscreen API silently degraded; presenter window is the contract). Appended status summary to `.lovable/issues/03-highlight-fullscreen-settings-and-llm-guide.md` and marked it closed.

### Tests
- **`.hl background-color` regression test.** `src/components/slides/highlight-style-guardrails.test.ts` now asserts `.hl` declares `background-color: var(--slide-hl)` and that `--slide-hl` is not transparent. Fails fast if a future refactor collapses the rule back to `background:` shorthand or zeroes out the token. 3/3 green.

## 1.30.0 — 2026-06-06

### Fixed
- **`matchesShortcut` no longer crashes on missing `def`.** `src/components/slides/shortcuts.ts:128–140` now returns `false` when `def?.keys` is undefined. Root cause: callers pass `SHORTCUTS.find(...)` directly; when an id is renamed `find` returns `undefined` and the keymap pipeline crashed silently with `TypeError: Cannot read properties of undefined (reading 'keys')`. The previous shortcut-test failure (`is case-insensitive on letter keys`) was the only signal of this latent bug.

### Tests
- **`shortcuts.test.ts` green again (5/5).** Lookups switched from brittle `display` strings (e.g. `"F"`, which became `"F / F5"`) to stable `id` (`"fullscreen-toggle"`). New regression test asserts `matchesShortcut(ev, undefined)` returns `false` so the keymap can never crash on a missing id.

## 1.29.0 — 2026-06-06

### Added
- **LLM guide download in Settings.** New "LLM guide" section in `SettingsDrawer.tsx` ships a single-click `.zip` (`glasswing-llm-guide.zip`) containing `README.txt`, `llm-json-guideline.md`, and `sample-deck.json` (both Vite `?raw` imports). `fflate` (`zipSync`) is dynamic-imported on click to keep first-paint bundle small. Errors surface via `toast.error` + `console.error` (memory: never swallow). New dep: `fflate@0.8.3`.

## 1.28.0 — 2026-06-06

### Added
- **Highlight color picker in Settings.** New `hlColor?: string` field on `DeckSettings` (`src/components/slides/types.ts:235`, `src/lib/slides/schema.ts:202`). `RenderSlide` `ThemeWrap` (lines 85–87) sets `--slide-hl` inline when present so the new yellow `.hl` background re-tints live. `SettingsDrawer.tsx` gains a Highlight-color section (color input + Auto reset + 6 swatch presets) directly under Text-color. Regression test `settings-hl-color-applied.test.tsx` (2/2 green) locks the override + theme fallback.

## 1.27.0 — 2026-06-06

### Fixed
- **Fullscreen from preview iframe now opens true fullscreen.** `enterFullscreen` in `src/components/slides/useFullscreen.ts` (lines 146–160) previously short-circuited every embedded context to in-app "presentation mode" — a `position: fixed; inset: 0` cover bounded by the iframe viewport, which the user reported as "covers in" rather than fullscreen. Lovable's preview iframe lacks `allow="fullscreen"`, so the only path to true browser fullscreen is a top-level window. The embedded branch now calls `openPresenterWindow()` first; on success returns `{ mode: "presenter-window" }` and clears app-presentation mode; on popup-block returns `{ ok: false, reason: "embedded-popup-blocked" }` so `reportFullscreenFailure` surfaces the existing toast + persistent fallback URL. Top-level (non-embedded) behavior unchanged. Tests in `fullscreenTarget.test.ts` updated to lock the new contract (13/13 green).

## 1.26.0 — 2026-06-06

### Fixed
- **Yellow highlighter is visible again.** `.hl` in `src/styles.css` (lines 227–240) now paints a flat yellow background (`var(--slide-hl)`) behind the word with dark ink (`var(--slide-hl-ink)`) and keeps the spec text-shadow `rgb(0 0 0) 1px 0.7px 0px`. Previously `.hl` only colored the text yellow, so on light themes the highlight was invisible. No blur, no glow, no multi-layer shadows — complies with `.lovable/memory/avoid/02-no-hl-glow.md` and `decisions/02-highlight-text-shadow.md`. `box-decoration-break: clone` keeps the background continuous across line wraps.

## 1.25.0 — 2026-06-06

### Tests
- **Regression lock for keydown target-guard.** Extracted `resolveKeyEventElement()` (exported from `SlidePresenterPage.tsx`) and added two tests in `SlidePresenterPage.keyboard.test.ts` proving Document/Window/null targets resolve to `null` (so `.closest` is never called on them) and real Elements pass through. This prevents the silent TypeError that killed `I`, `M`, `T`, `G`, `J` ever returning.

### Closed
- Plan `03-text-shadow-shortcuts-fix` moved to `.lovable/plans/completed/` with `Status: completed`. Text-shadow on dark preset (1.23.0) + registry-driven shortcut restoration (1.24.0) + regression lock (this release) close out the plan.

### Verification
- `bunx vitest run SlidePresenterPage.keyboard.test.ts presenterActions.test.ts themeWrap.test.tsx` → **18/18 passed** (4 keyboard + 8 presenter actions + 8 theme wrap).


## 1.24.0 — 2026-06-06

### Fixed
- **`I` and all registry-driven shortcuts restored.** `SlidePresenterPage.tsx:176` called `target?.closest(...)` without checking the target was an `Element`. When keydown bubbled to `window`/`document` with no focused element, `event.target` was the `Document` (no `.closest`) and the handler threw a silent `TypeError` BEFORE reaching `dispatchPresenterKey` — so `I` (camera), `M`, `T`, `G`, `J`, etc. all died. `F` survived because it's matched in the early branch at lines 169-172. Guarded with `rawTarget instanceof Element` before the `closest` call.

### Verification
- `bunx vitest run SlidePresenterPage.keyboard.test.ts presenterActions.test.ts` → **10/10 passed**.


## 1.23.0 — 2026-06-06

### Fixed
- **Slide text-shadow restored under dark preset.** `applyDarkPresetTokens` in `src/components/slides/RenderSlide.tsx` was overwriting `--slide-text-shadow` with `none`, which contradicted the spec at `src/styles.css:174-176` and the light-on-dark branch in `themeStyle()` (`src/components/slides/themes.ts:114-115`). With the dark preset (light text on dark bg) being the canonical case for the ink-stamp shadow, it is now preserved as `rgb(0 0 0) 1px 0.7px 0px`. Updated `themeWrap.test.tsx` assertion accordingly.

### Verification
- `bunx vitest run themeWrap.test.tsx themes.test.ts highlight-style-guardrails.test.ts` → **16/16 passed**.


## 1.22.0 — 2026-06-06

### Planning
- **Next 2 steps committed.** Recorded the next two execution steps for the pending `03-text-shadow-shortcuts-fix` plan: (1) guideline + spec audit with a one-sentence root cause, (2) text-shadow rendering-path inspection across `src/styles.css` `.hl` and the active rich-text emitter. Remaining steps 3–8 of the plan plus appended prior pending tasks (`01-slides-first-preview`, `02-present-fullscreen-preview-fix`) stay queued.
- Saved the invoking prompt to `.lovable/prompts/03-next-task.md` for chat-history retrieval.


## 1.21.0 — 2026-06-06

### Fixed
- **Actionable e2e host preflight.** `bun run test:e2e` now runs `scripts/check-playwright-host.mjs` before Playwright specs. If Chromium cannot launch because a host library is missing, the script logs `[e2e:preflight] Chromium failed to launch`, names the missing library when Playwright reports it, and points to `bunx playwright install --with-deps chromium` instead of failing later with an opaque test-runner crash.

### Changed
- Added `test:e2e:raw` for bypassing the preflight in CI images that already perform their own browser-host validation.

## 1.20.0 — 2026-06-06

### Tests
- **Launcher browser smoke.** Added `e2e/launcher-cases.spec.ts` covering `/` redirecting to `/slides/1`, the full visible launcher case set, expected link hrefs, and the Settings launcher click reaching the dev `window.__slidesEvents` buffer.

### Verification
- Playwright test discovery succeeds, but local execution is blocked by sandbox browser dependencies after Chromium install: `chrome-headless-shell: error while loading shared libraries: libglib-2.0.so.0`. The preview browser still confirms the Settings click opens the drawer and exposes the `slides:event buffer` panel.

## 1.19.0 — 2026-06-06

### Added
- **Dev-only slides event viewer.** `SettingsDrawer` now mounts `DevSlidesEventsPanel` inside the existing `import.meta.env.DEV` section, rendering the latest 20 `window.__slidesEvents` entries with timestamp, event type, payload summary, and a Clear action. This makes `home-launcher-click` telemetry visible in-app without DevTools while keeping production builds unchanged.

### Tests
- Added `SettingsDrawer.dev-events.test.ts` to lock that the viewer remains dev-gated, and exported the `BufferedEvent` type from `telemetry.ts` for the panel.

## 1.18.0 — 2026-06-06

### Added
- **`window.__slidesEvents` dev ring buffer.** `emitSlidesEvent` (`src/components/slides/telemetry.ts`) now also pushes each event (timestamped) into a capped buffer of the last `SLIDES_EVENT_BUFFER_CAP = 200` events, exposed on `window.__slidesEvents` in dev/preview builds. Closes the v1.13.0 telemetry observability gap — `home-launcher-click` (and every other slides event) is now inspectable from DevTools without an external sink. Strictly disabled when `import.meta.env.PROD`.

### Tests
- Added 2 ring-buffer tests to `telemetry.test.ts` (now 5 passing): capture-with-timestamp and FIFO cap-and-drop-oldest behavior at `SLIDES_EVENT_BUFFER_CAP + 5` events.

## 1.17.0 — 2026-06-06

### Tests
- **Persist-drop coverage.** Extracted `migratePersistedDeck` from the inline `persist` config in `src/components/slides/store.ts` and added `persist-migrate.test.ts` (2 tests) locking the contract: same-version returns the payload untouched with no console output; off-version returns `undefined` and emits a single `console.warn` containing both `[slides:persist] dropping`, the stale `v<N>`, and the `current v<M>`. Closes the v1.16.0 verification gap so future `DECK_SCHEMA_VERSION` bumps can't silently swallow the destructive drop.

## 1.16.0 — 2026-06-06

### Fixed
- **Schema-versioned deck persistence.** `useDeck` (zustand `persist`) now stamps `version: DECK_SCHEMA_VERSION` (currently `2`) on the persisted payload and registers a `migrate` callback. When `DECK_SCHEMA_VERSION` bumps, stale localStorage payloads are dropped observably with `[slides:persist] dropping v<N> payload (current v<M>); re-import the deck JSON to restore.` instead of silently crash-loading into the new shape. The `slides-deck-v1` localStorage key is preserved so existing user decks survive on same-version reloads.

## 1.15.0 — 2026-06-06

### Added
- **In-UI storage note for imports.** Settings → Import / Export now shows a muted caption clarifying that imported decks live in this browser's `localStorage` (`slides-deck-v1`) only — no cross-browser/device sync — and points at `docs/slides/spec/import-export.spec.md` for the full contract. Closes the recurring "is import even working / where do imports go?" question loop.

## 1.14.0 — 2026-06-06

### Docs
- **Import/export spec coverage.** `docs/slides/spec/import-export.spec.md` now documents the two import surfaces (`Import deck`, `Import slide`) wired in `SettingsDrawer.tsx`, the validation/rejection contract, and a table of storage keys (`slides-deck-v1`, `slides-deck-settings-v1`, `riseup.*`) clarifying that imported decks live in browser `localStorage` only — no server, no cross-device sync.
- Linked the 17-slide `sample-deck.json` (covers every slide `type`) from the spec as the canonical multi-slide reference, mirroring §12 of the LLM JSON guideline.

### Confirmed (no code change)
- Single-deck import path verified end-to-end: `handleImportDeck` → `parseDeckJson` (Zod `DeckSchema`) → `useDeck.setDeck` → clears annotations, restores `meta.runtime`, navigates to slide 1. Single-slide import via `upsertSlide` likewise functional.

## 1.13.0 — 2026-06-06

### Added
- **DeckLauncher regression lock.** Added `DeckLauncher.test.tsx` covering every launcher case from `.lovable/plans/subtasks/01-slides-first-preview/03-launcher-cases.md`: Present, Inspector, Handout, 3-up, Print, Overview, Import, Export, and Settings.
- **Launcher telemetry.** `DeckLauncher` now emits `home-launcher-click` events with `{ case }` through the shared `slides:event` telemetry bus before running each launcher action, giving future regressions a visible signal.

### Tests
- Verified focused launcher/telemetry coverage: `bunx vitest run src/components/slides/controls/DeckLauncher.test.tsx src/components/slides/telemetry.test.ts` → 2 files / 6 tests passing.

## 1.12.0 — 2026-06-06

### Fixed
- **Settings drawer parity (plan step 12).** `SettingsDrawer` now exposes the spec-required Visibility rows for Presenter top bar, Slide number badge, and Dot pagination, plus a read-only Controller indicator note.
- Mounted the previously orphaned `PresenterTopBar` and `DotPagination` surfaces in `SlidePresenterPage`; `J` now reaches the registered `toggle-top-jumper` action instead of being suppressed before dispatch.

### Tests
- Added `slide-number-surfaces.test.tsx` and verified the focused slide-control suite: 3 files / 12 tests passing.

## 1.11.0 — 2026-06-06

### Fixed
- **Controller / launcher coexistence (plan step 11).** On `/slides/1` (deck home, no step, non-fullscreen) `ControllerPill` is now suppressed because `DeckLauncher` already owns the bottom-center chrome. Prevents the two toolbars from overlapping and double-claiming the same hover zone. Edit: `src/components/slides/SlidePresenterPage.tsx` (gate on `!(current === 1 && !isStepRoute)`).

## 1.10.0 — 2026-06-06

### Planning
- `next task 14` (planning-only). Surfaced next 2 plan steps for `01-slides-first-preview`: **Step 11** (controller-pill coexistence with launcher across ≥1280/<1280) and **Step 12** (settings drawer parity vs `spec/old-slides/27-slides-number/10-visibility-and-settings.md`).
- No app code changed this turn. Subtask files `05-controller-coexistence.md` and `06-settings-alignment.md` already scaffolded — execution slated for next turn.

## 1.9.0 — 2026-06-06

### Added
- **DeckLauncher** (`src/components/slides/controls/DeckLauncher.tsx`): bottom-center toolbar mounted on `/slides/1` (deck home, non-fullscreen, no step). Buttons: Present, Inspector, Handout, 3-up, Print, Overview, Import, Export, Settings — each cited in `.lovable/plans/subtasks/01-slides-first-preview/03-launcher-cases.md`.
- Reduced-motion aware (uses `useReducedMotion()`); semantic tokens only (no hex). Import/Export errors logged + surfaced via toast (no silent failure).

### Changed
- `SlidePresenterPage` mounts `<DeckLauncher />` next to existing chrome; visibility gated by `!isFs && current === 1 && !isStepRoute`.

## 1.8.0 — 2026-06-06

### Changed
- **Slides-first preview.** `/` now redirects to `/slides/1` so the deck is the first surface (per `.lovable/spec/commands/01-slides-first-preview.md`). Marketing/landing content moved verbatim to `/about` (`src/routes/about.tsx`).
- Updated `mem://index.md` Core with the slides-first guardrail.

### Added
- Diagnostic RCAs under `.lovable/memory/diagnostics/`: `03-root-not-slides-first-rca.md`, `04-controller-vs-spec-rca.md` (preliminary), `05-settings-vs-spec-rca.md` (preliminary).

### Resolved
- Issue `.lovable/issues/01-root-not-slides-first.md` — marked fixed by the redirect.

## 1.7.0 — 2026-06-06

### Planning
- Filed plan `.lovable/plans/pending/01-slides-first-preview.md` (30 steps) to flip `/` to a slides-first shell with a launcher exposing every spec-documented case (Present, Inspector, Handout, Handout-3up, Print, Audience, Import/Export, Settings).
- Captured commands: `01-slides-first-preview` (slides-first IA) and `02-write-rca-before-implementing` (RCA before any multi-step implementation) under `.lovable/spec/commands/`.
- Filed issue `.lovable/issues/01-root-not-slides-first.md` for the marketing-first regression on `/`.
- Created 8 subtask specs under `.lovable/plans/subtasks/01-slides-first-preview/` (RCA, IA decision, launcher cases, visual contract, controller coexistence, settings alignment, test plan, verification matrix). No code changes this release — execution scheduled for v1.8.0.
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
## [1.6.0] — 2026-06-06

### Fixed
- **Camera bubble completion (issue 005)**: fullscreen-only camera visibility now uses a shared presenter-context helper, so `?present=1` popup windows satisfy the gate without duplicating URL parsing inside `CameraBubble`. `useCamera` now logs `[slides:camera] getUserMedia failed` with browser error context before surfacing denied/error states.
- **Runtime export/import round-trip (issue 009)**: deck exports now include `meta.exportedAt` plus `meta.runtime` snapshots for camera chrome, annotations, and known `riseup.webcam.*` preferences. Imports restore that metadata through the same parse/setDeck flow and log `[slides:runtime-meta] restored deck runtime metadata` when it applies.

### Added
- `src/lib/slides/runtimeMeta.ts` + `src/lib/slides/io-runtime-meta.test.ts`
- `docs/slides/spec/import-export.spec.md`

## [1.5.0] — 2026-06-06

### Fixed
- **Image background contrast (issue 026)**: switching `backgroundMode`
  to `image` from the SettingsDrawer now auto-bumps `darken` from 0 →
  35 so default text colors stay readable over bright photos. Respects
  any non-zero value the user already chose. Auto-luminance toggle is
  the follow-up.
- **HMR stale-deck escape hatch (issue 018)**: SettingsDrawer now
  shows a dev-only "Reset cached deck" button (`import.meta.env.DEV`
  gated) that clears the zustand-persist snapshot and reseeds the
  default deck. The full migrate-on-version-bump fix is queued as a
  follow-up; this gives developers an immediate way out of stale-HMR
  loops.

### Added
- `src/components/slides/backgroundMode.ts` + test
- `src/components/slides/devResetDeck.ts` + test

## [1.4.0] — 2026-06-06

### Fixed
- **Annotations don't leak across decks (issue 019)**: confirmed
  `setDeck` clears `useAnnotations` and locked the contract with
  `annotations-cross-deck.test.ts` — the test specifically uses
  overlapping slide ids between two decks (the original bug repro).
  Chose "clear-on-replace" over `${deckId}:${slideId}` keying because
  annotations are session-only by default; wiping on import matches
  user intent and avoids a storage migration.
- **Popup presenter window loses deck on refresh (issue 020)**: added
  a cross-window `storage` event listener (`syncDeckAcrossWindows`) in
  `store.ts` that re-runs `useDeck.persist.rehydrate()` when another
  tab writes `slides-deck-v1`. Popup presenter and second editor tabs
  now pick up imports from the opener tab without a manual reload.

### Added
- `src/components/slides/annotations-cross-deck.test.ts`
- `src/components/slides/store-cross-window-sync.test.ts`
- `syncDeckAcrossWindows()` export in `src/components/slides/store.ts`

## [1.3.0] — 2026-06-06

### Fixed
- **Sample-deck pipeline lock (issue 013)**: `sample-deck.test.ts` now
  also runs the deck through the same `?raw` → `parseDeckJson` pipeline
  used by `SettingsDrawer`'s "Try spec sample deck" button. Schema drift
  fails CI before it can surface as a runtime error toast.
- **`setDeck` side-effects lock (issue 010)**: regression test asserts
  `useDeck.setDeck` clears `useAnnotations.strokes` and reseats
  `lastVisitedSlideId` on the new deck's first slide. The behaviour was
  already implemented; the lock prevents silent regression.

### Added
- `src/components/slides/store-setdeck-side-effects.test.ts`
- Raw-pipeline assertion in `src/lib/slides/sample-deck.test.ts`

## [1.2.0] — 2026-06-06

### Fixed
- **SettingsDrawer z-index (issue 016)**: drawer is now `--z-drawer: 280`,
  above the controller pill (`--z-controller: 260`) and camera bubble
  (`--z-camera: 270`). Chrome layer scale documented in
  `docs/slides/spec/z-index.spec.md`.
- **Controller overflow parity (issue 015)**: parity test locks that the
  overflow-menu Settings/Help items invoke their callbacks, so a future
  id/callback rename can't silently turn them into no-ops.
- **BroadcastChannel churn (issue 021)**: `useAudienceSync` keeps one
  channel per `sessionId` instead of recreating it on every slide
  navigation. Stable listener identity, no dropped messages mid-swap.
- **Controller anchor stuck after resize (issue 029)**: new pure
  `clampControllerAnchor` helper + resize listener in `ControllerPill`
  snaps a corner anchor back to `bottom-center` when the viewport
  shrinks below the pill's required width.

### Added
- `docs/slides/spec/z-index.spec.md` — single source of truth for the
  chrome stacking order.
- Regression locks: `SettingsDrawer.zindex.test.tsx`,
  `ControllerOverflowMenu.parity.test.tsx`, `useAudienceSync.test.ts`,
  new `clampControllerAnchor` cases in `controller-anchor.test.ts`.

## [1.1.0] — 2026-06-05

### Fixed
- **Fullscreen breakout**: slide canvas, camera bubble, and controller chrome
  now stay clipped to the scaled 1920×1080 slide frame in native fullscreen
  on all viewport sizes.
  - `ScaledSlide` writes `--presenter-frame-{left,top,right,bottom}` CSS vars
    and falls back to parent rect / `visualViewport` when the stage measures 0px.
  - `useFullscreen` targets the stable `/slides` root so portaled overlays
    share one native fullscreen surface.
  - `CameraBubble` clamps to the stage frame and clips overflowing chrome
    while in fullscreen.
  - `controller-anchor` positions anchors against the slide-frame vars
    instead of the viewport.
- Slide presenter routing: `/slides/N` and `/slides/N/S` resolve by 1-based
  index, not slide id; parent layout renders `<Outlet />`.

### Added
- Presenter inspector (B22): speaker view at `/slides/inspector/$slideId(/$step)`
  with persistent timer, scoped keymap (R/P/Esc/arrows).
- Presenter controller pill (B21): 4 anchors, hover-reveal with reduced-motion
  support, overflow menu below 1280px, single keymap registry.
- Regression tests for stage-fill camera containment, controller anchor
  clamping, fullscreen target, and ScaledSlide zero-measurement fallback.

### Changed
- Default slide transition is `fade` (not `camera-zoom`); zoom is opt-in for
  hero/title moments only.
- All animated slide surfaces consult `useReducedMotion()` from
  `@/components/slides/useReducedMotion`.

## [1.0.0] — Initial release

- JSON-driven deck format, three themes, six slide layouts, four transitions.
- Keyboard navigation, deck and single-slide import/export.
