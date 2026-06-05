---
name: presenter-controller-pill
description: Controller pill architecture (B21) — 4 anchor positions, B shortcut, persistence key, hover-reveal timings, overflow menu breakpoint, single keymap contract
type: feature
---

# Presenter Controller Pill (B21)

Single mounted controller for the slide presenter. Persistent across
`/slides/N` ↔ `/slides/N/S` route changes via `PresenterShell` hoisted
into `slides.$slideId.tsx`.

## Anchors
- `ControllerAnchor` = `"bottom-center" | "bottom-right" | "bottom-left" | "top-right"` (only 4 — earlier 8-anchor system was retired).
- Cycle order: `bottom-center → bottom-right → bottom-left → top-right → …`
- Persisted in `localStorage` under `riseup.controller.anchor` via Zustand `persist` (`controller-anchor-store.ts`). Never use the legacy `slides-controller-pos-v2` key.
- Two ways to cycle: right-click the pill or press `B`. Top-level `B` handler in `SlidePresenterPage` uses `e.stopImmediatePropagation()` to win over other listeners.

## Hover-reveal (collapsed state)
- `useHoverReveal(ref)` returns `{ isExpanded, handleEnter, handleLeave }`.
- Timings: `HOVER_REVEAL_EXPAND_MS = 160`, `HOVER_REVEAL_COLLAPSE_GRACE_MS = 400`.
- Stays open while any descendant has `data-state="open"` (Radix popovers/menus).
- Under `prefers-reduced-motion: reduce` both timers collapse to 0ms (Step 28). Always consult `useReducedMotion()` — never inline `matchMedia`.

## Overflow menu (<1280px)
- `useNarrowViewport()` matches `(max-width: 1279px)`; constant `NARROW_VIEWPORT_BREAKPOINT_PX = 1279`.
- At narrow widths, Theme/Music move into the `ControllerOverflowMenu` header strip and Settings/Help become `DropdownMenuItem` children. Trigger has `aria-label="More controls"`.
- Share stays inline at all sizes.

## Single keymap (Step 26)
- `SHORTCUTS` (in `shortcuts.ts`) owns the keys. Every entry has a stable `id`.
- `presenterActions.ts` owns the side-effects: `PRESENTER_KEY_ACTIONS: Record<id, (ctx) => void>` + `MODIFIER_SHORTCUT_IDS` allow-list for combos handled inline (nav arrows, Cmd+K, Cmd+Shift+L, Shift+Space, Shift+letter pairs).
- Presenter `keyHandler` dispatches plain keys via `dispatchPresenterKey(ctx)`. Adding a new plain-key shortcut requires both a SHORTCUTS entry AND an action — parity enforced by `presenterActions.test.ts`.
- New shortcuts MUST add `id` first; never grow the legacy `if` ladder.

## Files
- `src/components/slides/PresenterShell.tsx` — fullscreen-safe shell.
- `src/components/slides/controls/ControllerPill.tsx` — toolbar (role="toolbar", aria-label="Slide controller").
- `src/components/slides/controls/controller-anchor.ts` + `controller-anchor-store.ts`.
- `src/components/slides/controls/useHoverReveal.ts` + tests.
- `src/components/slides/controls/useNarrowViewport.ts`.
- `src/components/slides/controls/ControllerOverflowMenu.tsx` + tests.
- `src/components/slides/shortcuts.ts` + `presenterActions.ts` + tests.
- `e2e/controller-happy-path.spec.ts` — anchor/cycle, overflow, wide-viewport.

## Diagnostics
Full RCA in `.lovable/memory/diagnostics/02-fullscreen-and-settings-rca.md` (steps 1–28).
