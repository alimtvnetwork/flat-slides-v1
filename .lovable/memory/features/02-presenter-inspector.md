---
name: presenter-inspector
description: Presenter Inspector (B22) — speaker view at /slides/inspector/$slideId(/$step), 4-pane layout, persistent timer with pause/reset, scoped keyboard shortcuts
type: feature
---

# Presenter Inspector (B22)

Standalone speaker view rendered outside the main presenter chrome.
Route tree mirrors the main slide routes but lives under `/slides/inspector/...`.

## Routes
- `src/routes/slides.inspector.$slideId.tsx` — layout parent, renders only `<Outlet />` (no double-mount of `SlidePresenterPage`).
- `src/routes/slides.inspector.$slideId.index.tsx` — leaf for `/slides/inspector/N` (step defaults to first).
- `src/routes/slides.inspector.$slideId.$step.tsx` — leaf for `/slides/inspector/N/S`.
- Slide IDs in the URL are **1-based slide numbers**, never `slide.id`. Steps are 1-based too.

## Model
- `resolveInspectorModel(slides, slideId, step?)` in `presenterInspectorModel.ts`:
  - Filters disabled slides, returns `null` for out-of-range numbers.
  - Clamps step into `[0..slideStepCount(slide) - 1]`.
  - Produces `{ slide, nextSlide?, slideNumber, totalSlides, stepIndex, stepLabel, notes }`.
- Covered by `presenterInspectorModel.test.ts`.

## View
- `PresenterInspectorView` mounts `PresenterShell` (non-fullscreen) and renders a 4-cell CSS grid:
  current slide (ScaledSlide + RenderSlide), next slide, speaker notes, footer.
- Split into `PresenterInspectorPanels.tsx` + `PresenterInspectorFooter.tsx` to honor the <100 lines-per-file guideline.
- Always consults `useReducedMotion()` — no inline `matchMedia`.

## Timer
- State on `chrome-store`: `inspectorTimerStartedAt`, `inspectorTimerPausedAt`, `inspectorTimerPausedMs`.
- Actions: `ensureInspectorTimerStarted`, `resetInspectorTimer`, `toggleInspectorTimerPause`.
- Start time persisted in `localStorage` under `riseup.inspector.startedAt` via `inspectorTimerPersistence.ts`.
- `useInspectorTimer()` returns `{ timerLabel, isTimerPaused, resetTimer, toggleTimerPause }`.
- Covered by `inspectorTimer.test.ts`.

## Keyboard (scoped — inspector only)
- `ShortcutScope = "presenter" | "inspector"` in `shortcuts.ts`; `matchShortcut(event, scope?)` filters by scope.
- Inspector shortcuts: `inspector-nav-prev` (←), `inspector-nav-next` (→/Space/Enter), `inspector-reset-timer` (R), `inspector-toggle-timer-pause` (P), `inspector-exit` (Esc).
- `INSPECTOR_KEY_ACTIONS` registry in `presenterActions.ts` mirrors the single-keymap contract from B21; parity test `presenterActions.test.ts` enforces drift.
- `usePresenterInspectorKeyboard` attaches the document-level listener and dispatches via `dispatchInspectorKey`.
- Covered by `inspectorKeyboard.test.ts`.

## Files
- `src/components/slides/PresenterInspector.tsx` (entry)
- `src/components/slides/PresenterInspectorView.tsx`
- `src/components/slides/PresenterInspectorPanels.tsx`
- `src/components/slides/PresenterInspectorFooter.tsx`
- `src/components/slides/presenterInspectorModel.ts` (+ test)
- `src/components/slides/useInspectorTimer.ts`
- `src/components/slides/inspectorTimerPersistence.ts`
- `src/components/slides/usePresenterInspectorKeyboard.ts`
- `src/components/slides/presenterInspectorNavigation.ts`
- `src/components/slides/presenterInspectorKeyGuards.ts`
- `src/components/slides/inspectorTimer.test.ts`, `inspectorKeyboard.test.ts`

## Spec
- `docs/slides/spec/presenter-inspector.spec.md`
