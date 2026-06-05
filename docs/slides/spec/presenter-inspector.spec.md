# Presenter Inspector (B22)

> Spec for the dedicated speaker view that surfaces the current slide, next
> slide, speaker notes, step counter, and elapsed timer in a single layout.

## Goals

- Give presenters a single screen with everything needed mid-talk.
- Stay opt-in: existing `PresenterNotesPeek` keeps working for casual use.
- Reuse the existing slide renderer — no fork of `RenderSlide`.

## Non-goals

- Multi-monitor sync (browser cannot reliably target a second display).
- Editing notes from the inspector.
- Replacing `PresenterNotesPeek` (kept for embedded preview).

## Route

`/slides/inspector/$slideId` and `/slides/inspector/$slideId/$step`.

- 1-based `$slideId` per Core memory rule (`slides[Number(slideId)-1]`).
- Standalone branch — does NOT nest under `slides.$slideId.tsx`, so the main
  `SlidePresenterPage` (controller pill, settings drawer, music toggle) does
  not double-mount on the inspector screen.
- Resolves the same slide + step the main presenter route does.
- Reuses `PresenterShell` for fullscreen clipping.


## Layout (1920×1080 reference)

```text
┌────────────────────────────────────────────────────────────┐
│ Current slide (60%)            │ Next slide (40%, scaled)  │
│                                │                           │
├────────────────────────────────┼───────────────────────────┤
│ Speaker notes (scrollable)     │ Step N/Total · Timer mm:ss│
└────────────────────────────────┴───────────────────────────┘
```

- Current slide: rendered via `ScaledSlide` at full fidelity.
- Next slide: same renderer, scaled to ~40% width, no interactions.
- Notes panel: `whitespace-pre-wrap`, supports long content with overflow.
- Footer strip: step counter (from `slideStepCount`) + elapsed timer.

## Timer

- Starts on first mount, persists in chrome store (`riseup.inspector.startedAt`).
- `R` resets, `Space` pauses/resumes. Skip when typing (mirrors existing pattern).

## Keyboard

- `←` / `→` / `Space` / `Enter` — reuse `presenterActions` registry (no fork).
- `R` — reset timer.
- `P` — toggle pause.
- `Esc` — exit to `/slides/$slideId`.

## Entry points

The inspector is launched from the main presenter — never from a deep link
the user has to memorise. Two paths share the same contract:

- **Keyboard**: `I` (SHORTCUTS id `open-inspector`, group `Presenter`).
  Registered in `PRESENTER_KEY_ACTIONS`; parity test in
  `presenterActions.test.ts` enforces the wiring and asserts the URL
  format.
- **Mouse**: "Open inspector" item in `ControllerOverflowMenu` (the `⋯`
  menu). Uses the shared `useSlideNumber()` hook so the URL stays in sync
  with the current `/slides/N` route.

Both call `window.open(`${origin}/slides/inspector/${current}`,
"riseup-presenter-inspector", "noopener,noreferrer")`. The named target is
load-bearing: subsequent launches reuse the same OS window instead of
spawning a tab per keypress, which is essential for the second-display
workflow.


## Reduced motion

- All transitions consult `useReducedMotion()` per Core memory rule.
- Inspector itself uses opacity-only fades when reduced.

## Reuse contract

- Slide rendering: `RenderSlide` (no duplication).
- Step resolution: `slideStepCount` + 1-based URL parsing.
- Shortcuts: extend `SHORTCUTS` with stable `id`s; side-effects in
  `presenterActions.ts`. Parity test must continue to pass.

## Out-of-scope follow-ups

- Multi-window sync via `BroadcastChannel`.
- Annotation overlay on the next-slide preview.
- Note editing from inspector.

## Implementation slices

1. Spec (this doc).
2. Route scaffolds (`slides.$slideId.inspector.tsx`, step variant).
3. Layout component + reuse of `ScaledSlide` and `RenderSlide`.
4. Timer + chrome-store state.
5. Shortcut wiring via `presenterActions` (R, P, Esc).
6. Tests: route resolution, timer reducer, shortcut parity.
7. Memory + pending-issues entries.
