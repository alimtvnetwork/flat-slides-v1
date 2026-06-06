# RCA 05 — Settings drawer vs `27-slides-number/10-visibility-and-settings.md`

**Created:** 2026-06-06
**Status:** preliminary — per-row diff deferred to follow-up plan `03-settings-spec-parity`.

## Root cause (one sentence)

`src/components/slides/SettingsDrawer.tsx` grew organically from feature requests (background mode, dev reset, camera) without ever being diffed against `spec/old-slides/27-slides-number/10-visibility-and-settings.md`, so the rows present, their grouping, and their persistence keys are not guaranteed to match the spec.

## What was read

- `spec/old-slides/27-slides-number/10-visibility-and-settings.md`
- `12-design-tokens.md`, `11-accessibility-and-motion.md`
- `src/components/slides/SettingsDrawer.tsx` (entry component)

## Known to be present today

- Background mode toggle (color / image) — wired via `nextBackgroundSettings` (`backgroundMode.ts`).
- Darken / blur sliders.
- Camera bubble visibility / shape (per camera-2026 work).
- Dev-only "Reset cached deck" (`devResetDeck.ts`).

## Known gaps to verify in follow-up

1. Visibility rows for: top-bar, badge, dot-pagination, controller indicator — spec mandates each is a user-toggleable visibility setting; current drawer does not expose all four.
2. Persistence-key naming convention `riseup.<area>.<key>` — partial; needs audit.
3. Section grouping (Visibility / Motion / Audio / Camera / Background) — current drawer is a single pane.
4. Accessibility: focus order + ARIA per 11-accessibility-and-motion.md — not verified.

## Action

A spec-row ↔ drawer-row table will be filled in `03-settings-spec-parity` before SettingsDrawer is restructured.

## References

- Spec: `spec/old-slides/27-slides-number/10-visibility-and-settings.md`
- Plan: `.lovable/plans/pending/01-slides-first-preview.md` (step 12)
