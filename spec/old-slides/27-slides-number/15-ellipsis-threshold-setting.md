# 15 — Ellipsis Threshold Setting

**Status:** spec (Plan 06 Phase A Step 6)
**Created:** 2026-06-06
**Source command:** `.lovable/spec/commands/06-slide-indicator-ellipsis-pagination.md`
**Companion spec:** `14-ellipsis-pagination.md` (slot builder + render contract)

Owns the user-facing control, persistence, and migration for
`riseup.controller.ellipsisThreshold`.

## 1. Storage

- **Key:** `riseup.controller.ellipsisThreshold`
- **Type:** integer string in localStorage (e.g. `"15"`).
- **Default:** `15`.
- **Valid range:** `5..50` inclusive. Anything else (NaN, out-of-range, missing) → fall back to default and do not overwrite storage.
- **Migration guard:** `riseup.controller.ellipsisThreshold.migrated.v1` — written on first read so a future schema change has a known prior state. No data migration needed at v1.

## 2. Read API (added to `src/slides/presetSettings.ts`)

```ts
// DEFAULT_PRESET_SETTINGS additions
ellipsisThreshold: 15,

// getPresetSettings() returns:
//   { …, ellipsisThreshold: number /* clamped to 5..50 */ }
```

- `getPresetSettings()` is the single read site. `SlideIndicator` and
  `DotPagination` consume `settings.ellipsisThreshold` and pass it to
  `buildPaginationSlots`.
- Reads MUST clamp; renderers do not re-clamp.

## 3. Settings drawer UI

Location: `src/components/slides/SettingsDrawer.tsx`, inside the existing
"Controller" group (same group as `showDotPagination`).

Control:
- Label: **"Compact slide numbers after"**
- Hint (small text under label): **"Show 1 … current ± 2 … last when deck exceeds this count."**
- Input: numeric stepper, `min=5`, `max=50`, `step=1`, `inputMode="numeric"`.
- Right-side suffix: **"slides"** (plain text).
- Below input: a **Reset to default (15)** ghost button, hidden when value already equals default.

Persistence:
- On change: clamp to `5..50`, write `riseup.controller.ellipsisThreshold`, fire the same settings-changed event used by `showDotPagination` so `SlideDeckPage` re-reads.
- Invalid keystrokes (non-digit) are ignored at the input; out-of-range numeric values are clamped on blur, not while typing.

## 4. Live preview behaviour

- Changing the value updates `SlideIndicator` and `DotPagination` on the next render of the deck — no reload.
- When the new threshold causes ellipses to appear or disappear, the active gold pill MUST animate via the existing shared `layoutId="dot-pagination-active"`; no flicker.

## 5. Accessibility

- Stepper has `aria-label="Slide-number compaction threshold"`.
- Hint text is associated via `aria-describedby`.
- Reset button is keyboard-focusable and has `aria-label="Reset compaction threshold to 15"`.
- Reduced motion: no extra animation rules — the spring is already governed by the existing `useReducedMotion()` consumer.

## 6. Testing contract

- Unit: `getPresetSettings()` returns `15` when key missing; `15` when key invalid (`"abc"`, `"0"`, `"99"`, `""`); the stored integer when in-range.
- Unit: writing the migration guard happens at most once.
- Integration: SettingsDrawer change → localStorage updated → next render of `SlideIndicator` reflects new slot count.
- Snapshot: stepper renders `Reset to default (15)` only when value ≠ 15.

## 7. Out of scope

- Per-deck overrides (future; would live on the deck JSON, not localStorage).
- Threshold sync across browser tabs (would use `storage` event; not required at v1).
- `GoToInput` popover wiring — owned by spec `14` and Phase C Step 29.
