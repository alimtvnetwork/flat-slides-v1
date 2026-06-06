# 018 — HMR after editing slide content sometimes shows the previous slide JSON

**Status:** open
**Area:** Zustand persist + HMR

## Symptom

Saving an edit, the preview keeps the old slide until a hard reload.

## Root cause

`useDeck`’s `persist` middleware caches under `riseup.deck`. On HMR the store rehydrates from localStorage which still holds the previous JSON.

## Fix plan

1. Bump `version` in the persist config and provide a `migrate` that discards stale snapshots in dev. 2. Add a dev-only “Reset cached deck” button in SettingsDrawer. 3. Document in `docs/slides/spec/persistence.spec.md`.

## Acceptance

- Behavior described in **Symptom** no longer reproduces.
- A regression test from **Fix plan** is added and passes locally.
- Any spec doc referenced in **Fix plan** is created/updated in the same change.

## Status log

- 2026-06-06 — opened. RCA + fix plan ready. No code changes yet (per user request — fixes deferred).

## Fix (2026-06-06, v1.5.0)

Shipped fix-plan step 2: dev-only "Reset cached deck" button in `SettingsDrawer.tsx` (gated by `import.meta.env.DEV`) that calls `devResetCachedDeck()` from `src/components/slides/devResetDeck.ts`. The helper awaits `useDeck.persist.clearStorage()`, runs `resetDeck()`, and wipes `useAnnotations`. Errors are logged with `[devResetCachedDeck]` prefix and surfaced as a `toast.error`.

The persist-version-bump + migrate approach (fix-plan step 1) is queued — it requires touching every persisted snapshot's shape and the user-facing impact (wiping in-progress work) needs a deliberate call.

Regression: `src/components/slides/devResetDeck.test.ts` covers happy-path reset + error-rethrow with `[devResetCachedDeck] clearStorage failed` log assertion.

- 2026-06-06 — fixed in v1.5.0 (partial — step 1 follow-up tracked).
