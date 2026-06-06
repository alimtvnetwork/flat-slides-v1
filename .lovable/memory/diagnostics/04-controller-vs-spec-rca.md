# RCA 04 — Controller pill vs `spec/old-slides/controller-2026/`

**Created:** 2026-06-06
**Status:** preliminary — full per-rule table deferred to follow-up plan after IA flip lands.

## Root cause (one sentence)

The controller pill (`src/components/slides/controls/ControllerPill.tsx` + `presenterActions.ts`) was implemented from `mem://features/presenter-controller-pill` only, not from the 11-file `controller-2026` spec, so anchor cycling, overflow-menu thresholds, and several action-id bindings are best-effort instead of spec-verified.

## What was read

- `spec/old-slides/controller-2026/01-controller-100-steps.md`
- `02-implementation-steps-C01-C10.md`, `03-test-execution-steps-CT01-CT10.md`, `04-test-execution-steps-CT11-CT20.md`
- `05..11-build-substeps-C01..C07.md`
- `spec/old-slides/27-slides-number/06-surface-controller-indicator.md`

## Known gaps to verify in follow-up

1. 4 anchors (`top-left`, `top-right`, `bottom-left`, `bottom-right`) — current code matches.
2. `B` cycles anchors — matches; skip-list per route NOT implemented (needed for `/` launcher coexistence).
3. <1280px overflow menu — implemented; threshold not asserted against spec.
4. Hover-reveal with `useReducedMotion()` — implemented; full parity check pending.
5. SHORTCUTS-id ↔ `presenterActions.ts` parity test — exists; spec-vs-test parity table not yet generated.
6. 27-slides-number surfaces (top-bar / badge / dot-pagination / legacy top jumper) — coverage status not yet enumerated.

## Action

A spec-rule → code-line mapping table will be filled in a dedicated follow-up plan (`02-controller-spec-parity`) before any code in `ControllerPill.tsx` or `presenterActions.ts` is modified.

## References

- Memory: `mem://features/presenter-controller-pill`
- Plan: `.lovable/plans/pending/01-slides-first-preview.md` (steps 4, 11, 16)
