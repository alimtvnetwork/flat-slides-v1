# 14 — Ellipsis Pagination (long-deck compaction)

**Status:** spec (Plan 06 Phase A Step 5)
**Created:** 2026-06-06
**Source command:** `.lovable/spec/commands/06-slide-indicator-ellipsis-pagination.md`

Applies to two surfaces:
- `src/components/slides/controls/SlideIndicator.tsx` (top-right number pill row)
- `src/components/slides/controls/DotPagination.tsx` (bottom dot strip; see `05-surface-dot-pagination.md`)

Both surfaces consume the same pure slot-builder so behaviour is identical.

## 1. Configuration

- Setting key: `riseup.controller.ellipsisThreshold` (localStorage).
- Default value: **15**.
- Allowed range: integer `5..50` inclusive. Values outside the range fall back to default.
- Read via `getPresetSettings().ellipsisThreshold`. Exposed in `SettingsDrawer` as a numeric stepper labelled "Compact slide numbers after".

## 2. Slot builder (pure)

```ts
type Slot =
  | { kind: 'number'; n: number }       // 1-based slide number
  | { kind: 'ellipsis'; id: 'left' | 'right'; range: [number, number] };

function buildPaginationSlots(
  current: number,    // 1-based
  total: number,
  threshold: number,  // default 15
  neighbors = 2,      // current ± neighbors
): Slot[];
```

### Rules (in order)

1. If `total <= threshold` → return every number `1..total` as `kind: 'number'`. No ellipses.
2. Otherwise compute the visible window:
   - Always include `1` and `total`.
   - Always include `current - neighbors .. current + neighbors`, clamped to `[2, total-1]`.
3. Insert `kind: 'ellipsis'` slots where any gap of **2 or more missing numbers** exists between adjacent visible numbers. A gap of exactly 1 is rendered as the single missing number (never an ellipsis hiding one slide).
4. Each ellipsis carries the inclusive `range` of slides it collapses, so the popover can scope to that range.
5. `id` is `'left'` for ellipses whose range ends below `current`, `'right'` otherwise. Used as React key and for popover anchoring.

### Worked examples (threshold 15, neighbors 2)

| total | current | slots                                            |
| ----- | ------- | ------------------------------------------------ |
| 12    | 5       | `1 2 3 4 5 6 7 8 9 10 11 12`                     |
| 20    | 1       | `1 2 3 … 20`                                     |
| 20    | 10      | `1 … 8 9 10 11 12 … 20`                          |
| 20    | 19      | `1 … 17 18 19 20`                                |
| 20    | 4       | `1 2 3 4 5 6 … 20`  (no left ellipsis: gap == 0) |
| 20    | 17      | `1 … 15 16 17 18 19 20`                          |
| 30    | 15      | `1 … 13 14 15 16 17 … 30`                        |

## 3. Rendering contract

- Number slots render exactly as today (active = gold pill via shared `layoutId`; inactive uses the slot's existing markup).
- Ellipsis slots render as a button:
  - Glyph `…` (U+2026), `font-display`, same height as a number slot, width `20px`.
  - `aria-label={`Slides ${range[0]} to ${range[1]}`}`.
  - On click: open the existing `GoToInput` popover anchored to the button, pre-filtered to `range`. Implementation of `GoToInput` is out of scope for this spec (see Plan 06 Phase C Step 29).
  - Hover/focus styling matches an inactive number slot (no gold pill — ellipses are never "active").
- Layout math (`SLOT = 24`, `maxWidth = min(slotCount * 24 + 32, 720)`) uses the slot count, not `total`. The horizontal-scroll fallback (`overflow = slotCount > 28`) is therefore unreachable once the threshold is sane, but the code path stays for safety.
- Shared active `layoutId="dot-pagination-active"` continues to animate between **number** slots only. Ellipses are not layout targets.

## 4. Keyboard & accessibility

- Tab order: numbers and ellipses are both in the natural DOM order.
- `aria-current="true"` only on the active number.
- Reduced motion: same rules as the existing dot/indicator surfaces — spring becomes `duration: 0.01`; ellipsis popover open/close uses opacity-only fade.

## 5. Testing contract

- Unit test `buildPaginationSlots` against the worked-examples table.
- Property test: for any `total` and `current`, `1` and `total` are always present, the active number is always present, and ellipses never hide a single number.
- Snapshot test on `SlideIndicator` and `DotPagination` at `total = 20, current = 10` to lock the rendered slot order.

## 6. Out of scope (handled in later steps)

- Threshold settings UI → spec `15-ellipsis-threshold-setting.md` (Step 6).
- `GoToInput` component (anchored popover with number filter) → Plan 06 Phase C Step 29.
