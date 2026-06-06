# Audit — SettingsDrawer vs `spec/old-slides/27-slides-number/`

**Date:** 2026-06-06 (v1.31.0)
**Subject:** `src/components/slides/SettingsDrawer.tsx`
**Reference spec:** `spec/old-slides/27-slides-number/10-visibility-and-settings.md` (the only spec describing per-toggle visibility in the drawer; the rest of spec 27 documents on-stage surfaces, not the drawer chrome).

> Note: spec 27 lives under `old-slides/` and predates the current drawer redesign. It is the **only** written contract for what the drawer must expose, so this audit treats it as authoritative for the visibility section and treats every other drawer section as net-new product surface that needs its own short contract here.

## Drawer section inventory (current, top → bottom)

Source lines in `SettingsDrawer.tsx`:

| # | Section            | Line | Origin                                  |
|---|--------------------|------|-----------------------------------------|
| 1 | Theme              | 197  | net-new (v1.25+)                        |
| 2 | Background         | 225  | net-new                                 |
| 3 | Text color         | 273  | issue 03 (v1.28.0)                      |
| 4 | Highlight color    | 304  | issue 03 (v1.28.0 → v1.31.0 regression-locked) |
| 5 | LLM guide          | 335  | issue 03 (v1.29.0)                      |
| 6 | Visibility         | 350  | **spec 27 / §10**                       |
| 7 | Camera             | 371  | net-new (B22 inspector)                 |
| 8 | Darken / Blur      | 427/435 | net-new (background tuning)          |
| 9 | Transition         | 446  | core slide behavior                     |
| 10 | Music volume      | 474  | net-new                                 |
| 11 | Import / Export   | 496  | core deck IO                            |
| 12 | Presenter tools   | 581  | controller + focus-editor entry         |
| 13 | Dev (HMR fix)     | 606  | issue 018                               |

## Parity check vs `10-visibility-and-settings.md`

The spec names three toggles that must live in `/settings`:

| Spec toggle           | Drawer control                                                                  | Status |
|-----------------------|---------------------------------------------------------------------------------|--------|
| Presenter top bar (`J`) | `Visibility` row: "Presenter top bar (J)" — line 354                          | ✅ present, keybind exposed |
| Slide number badge    | `Visibility` row: "Slide number badge" — line 358                               | ✅ present |
| Dot pagination (`showDotPagination`) | `Visibility` row: "Dot pagination" — line 362                  | ✅ present |

Spec also mandates:
- `data-print-hide="true"` on interactive chrome → out of scope for the drawer itself (lives on the on-stage surfaces).
- One-time `riseup.…Hidden.migrated.v1` migration → owned by `SlideDeckPage`, not the drawer.
- `StepsChain3DSlide` suppression of top bar/dots → owned by the rendering surface, not the drawer.

**Spec 27 §10 parity: PASS.** No drift, no missing controls, no renamed labels.

## Net-new sections (no spec coverage)

These exist because the product grew past spec 27. Recording them here so the next audit has a baseline:

- Theme, Background, Text color, Highlight color, LLM guide, Camera, Darken, Blur, Transition, Music volume, Import / Export, Presenter tools, Dev.

Each is small and self-contained; none conflict with §10. Recommend writing a thin `spec/settings-drawer.md` only when one of them gains complex sub-behavior.

## Findings

- **No gaps** against the only written spec section that covers the drawer.
- **No duplicates** (each section header appears once).
- **No conflicts** between net-new sections and §10.
- **Order is sensible:** visual (theme/bg/colors) → meta (guide) → behavior (visibility/camera) → tuning (darken/blur/transition/volume) → IO (import/export) → tooling (presenter/dev). No reorder recommended.

## Recommendation

Ship as-is. No code change required. Close the parity question by linking this audit from the next prompt and from issue 03's status block.
