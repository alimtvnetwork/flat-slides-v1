# 028 — Inspector timer resets when navigating between slides

**Status:** open
**Area:** PresenterInspector + inspectorTimerPersistence

## Symptom

User starts timer at slide 1; clicks slide 3 — timer jumps back to 00:00.

## Root cause

Timer state stored in component-local `useState`; persistence file exists but reads only `startedAt`, not the current ticking interval after route remount.

## Fix plan

1. Move timer to a Zustand slice (already drafted as `inspectorTimer`). 2. Restore from `riseup.inspector.startedAt` on mount. 3. Lock with `inspectorTimer.routeChange.test.ts`.

## Acceptance

- Behavior described in **Symptom** no longer reproduces.
- A regression test from **Fix plan** is added and passes locally.
- Any spec doc referenced in **Fix plan** is created/updated in the same change.

## Status log

- 2026-06-06 — opened. RCA + fix plan ready. No code changes yet (per user request — fixes deferred).

- 2026-06-06 — **fixed**. Verified the timer state already lives in the module-level Zustand `useChrome` slice with `ensureInspectorTimerStarted` as a no-op when `startedAt !== null`, and `readPersistedInspectorStartedAt` restores it from `riseup.inspector.startedAt` on cold mount. Added `src/components/slides/inspectorTimer.routeChange.test.tsx` to lock the survival contract across hook unmount/remount and hard refresh (2/2 green).
