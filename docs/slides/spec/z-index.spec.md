# Chrome layer (z-index) — single source of truth

All slide chrome surfaces use CSS variables defined in `src/styles.css` so
the stacking order is centralised and reviewable in one place. Never
introduce a one-off `z-[NNN]` for chrome — add a token here first.

| Layer        | Variable          | Value | Used by                              |
| ------------ | ----------------- | ----- | ------------------------------------ |
| Slide stage  | (auto)            |   1   | `ScaledSlide`, slide content         |
| Thumbnails   | (auto)            |  10   | Grid view, dot pagination            |
| Overlays     | `z-[55]`..`z-[90]`| 55–90 | Lint panel, palette, QR, coachmark   |
| Controller   | `--z-controller`  | 260   | `ControllerPill`                     |
| Camera       | `--z-camera`      | 270   | `CameraBubble`                       |
| **Drawer**   | `--z-drawer`      | 280   | `SettingsDrawer`                     |
| Toast        | `--z-toast`       | 290   | Sonner toaster                       |

## Rules

1. Drawer (`--z-drawer`) MUST be > controller (`--z-controller`) so the
   right-edge controls in the drawer are never occluded by the pill.
   Regression: `src/components/slides/SettingsDrawer.zindex.test.tsx`.
2. Toast (`--z-toast`) is the topmost chrome — always reachable.
3. Camera bubble sits between controller and drawer so the user can keep
   it visible while drawer is open without it stealing pointer over the
   drawer.

## History

- **Issue 016 (2026-06-06)** — SettingsDrawer was `z-[200]`, below the
  pill's `--z-controller: 260`. Promoted to a named `--z-drawer: 280`
  token and documented the scale.
