# Subtask 07 — Test plan

**Parent:** 01-slides-first-preview
**Slug:** test-plan
**Status:** partial
**Created:** 2026-06-06

## Progress

- 2026-06-06 — Added `src/components/slides/controls/DeckLauncher.test.tsx`; verifies every case button/link renders, route targets are correct, Present/Settings callbacks fire, Import/Export IO is invoked, and `home-launcher-click` telemetry is emitted before each action.
- Validation: `bunx vitest run src/components/slides/controls/DeckLauncher.test.tsx src/components/slides/telemetry.test.ts` → 2 files / 6 tests passing.
- 2026-06-06 — Added `e2e/launcher-cases.spec.ts`; covers `/` redirecting to `/slides/1`, visible launcher cases, route hrefs, and Settings click telemetry landing in `window.__slidesEvents`. Local execution is blocked in this sandbox by Chromium host dependency `libglib-2.0.so.0`; keep it in CI/browser-capable environments.
- 2026-06-06 — Added `scripts/check-playwright-host.mjs` and wired `bun run test:e2e` through it. The sandbox still lacks Chromium host libraries, but the failure is now an explicit `[e2e:preflight]` missing-library message instead of an opaque browser launch crash.

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
- `e2e/launcher-cases.spec.ts` — `/` reaches the slide launcher, every link case
  has the expected target, and Settings click telemetry appears in
  `window.__slidesEvents`. ✅ added; sandbox run blocked by missing Chromium host lib.
