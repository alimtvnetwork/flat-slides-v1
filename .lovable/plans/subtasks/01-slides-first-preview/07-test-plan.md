# Subtask 07 — Test plan

**Parent:** 01-slides-first-preview
**Slug:** test-plan
**Status:** partial
**Created:** 2026-06-06

## Progress

- 2026-06-06 — Added `src/components/slides/controls/DeckLauncher.test.tsx`; verifies every case button/link renders, route targets are correct, Present/Settings callbacks fire, Import/Export IO is invoked, and `home-launcher-click` telemetry is emitted before each action.
- Validation: `bunx vitest run src/components/slides/controls/DeckLauncher.test.tsx src/components/slides/telemetry.test.ts` → 2 files / 6 tests passing.

## Unit tests (vitest)

- `DeckLauncher.test.tsx` — renders one button per case from
  `03-launcher-cases.md`; each button targets the expected route or
  fires the expected action (mock `useNavigate`, `openHomePresenterWindow`,
  `enterFullscreen`, `pickJsonFile`, `exportDeck`, `devResetCachedDeck`). ✅
- `SlidesHomeShell.test.tsx` — renders `<ScaledSlide />` with slide
  index 0 and the launcher; respects `useReducedMotion()`.
- Parity test (extend `presenterActions.test.ts`) — `B`-cycle skip-list
  on `/` excludes `bottom-center`.

## Route tests

- `-slides-home.test.tsx` — visiting `/` renders the deck canvas (not
  marketing copy); marketing copy moved to `/about` (new
  `-about.test.tsx`).
- Update `-slides-layout.test.tsx` if it asserts a redirect from `/` to
  `/slides`.

## e2e (playwright)

- `e2e/controller-happy-path.spec.ts` — start at `/`, click "Present",
  assert fullscreen entry.
- `e2e/fullscreen-present.spec.ts` — same starting point change.
- New `e2e/launcher-cases.spec.ts` — every launcher button reaches its
  target route or invokes its handler exactly once.
