# 02 — Fullscreen, Settings, Music, Controller RCA (B21)

Status: Step 2 (audit-only). No code changed in this step.

## Step 1 — Reproduction (carried over from B21/step 1)

User-reported symptom: "fullscreen forward-nav fixed except on this page".
The active preview at capture time was `/` (home). Home now has a Present
button (B21/step 1) that launches `/slides/$first?present=1` and arms
fullscreen on user gesture — verified working.

Routes that participate in present/fullscreen and their owners today:

| Route                       | Owner component       | Calls RenderSlide | Calls useFullscreen |
| --------------------------- | --------------------- | ----------------- | ------------------- |
| `/`                         | `routes/index.tsx`    | no                | enter (gesture)     |
| `/slides`                   | `slides.index.tsx`    | yes (preview)     | no                  |
| `/slides/$slideId`          | `SlidePresenterPage`  | yes               | yes (toggle)        |
| `/slides/$slideId/$step`    | `SlidePresenterPage`  | yes               | yes (toggle)        |
| `/slides/handout`           | `slides.handout.tsx`  | yes               | no                  |
| `/slides/handout-3up`       | `slides.handout-3up.tsx` | yes            | no                  |
| `/slides/print`             | `slides.print.tsx`    | yes               | no                  |
| `/slides/spec`              | `slides.spec.tsx`     | n/a (docs)        | no                  |

## Step 2 — Fullscreen owner audit (findings)

### 2.1 Single native target — OK

`useFullscreen.enterFullscreen` already targets `document.documentElement`
unconditionally (lines 87–113). The `target` arg is kept only as a visual
shell hint. Regression coverage: `fullscreenTarget.test.ts` asserts the
document is the request target even when callers pass a transient route
node. No code change needed for "single target" (step 7 is satisfied).

### 2.2 Embedded-window fallback — OK

`enterFullscreen` short-circuits to `openPresenterWindow` when
`isEmbeddedWindow()` is true; on popup-block it surfaces
`embedded-popup-blocked` and the chrome store renders
`PresenterFallbackLink`. Verified in `presenterWindowUrl.test.ts`.

### 2.3 Route-param navigation — RISK (drives step 8)

`slides.$slideId.index.tsx` and `slides.$slideId.$step.tsx` each render
their own `<SlidePresenterPage slideId={slideId} />`. TanStack Router
swaps the matched leaf component on `/N` ↔ `/N/S` transitions, so:

- Native fullscreen survives (target is `document.documentElement`).
- `SlidePresenterPage` itself **re-mounts**, which means:
  - `ControllerPill` re-mounts → collapsed/expanded state resets unless
    persisted in `chrome-store` (it is, but hover-grace timer is lost).
  - `SettingsDrawer` unmounts mid-edit.
  - Any non-module-scope audio state inside the presenter resets.
- The `SlidesFullscreenRoot` wrapper in `slides.tsx` and the empty
  `slides.$slideId.tsx` layout do persist across `/N` ↔ `/N/S`, so the
  fix (step 8) is to hoist `PresenterShell` (Controller + Settings +
  Music + KeyboardShortcuts + Fullscreen toggle) into
  `slides.$slideId.tsx`, leaving only `<RenderSlide>` in the leaves.

### 2.4 Custom `keydown` in presenter — RISK (drives step 26)

`SlidePresenterPage` line ~326 calls `document.exitFullscreen()` then
`navigate({ to: "/slides" })`. This is the only direct exitFullscreen
call outside the `useFullscreen` hook; it is correct (Escape → leave),
but the keyboard handler that triggers it is not yet routed through
`SHORTCUTS`. Confirmed there is exactly one fullscreen-toggle call site
in production code (`SlidePresenterPage` line 78). No duplicate owners.

## Step 3 — Settings → background pipeline (findings)

`ThemeWrap` is defined inside `RenderSlide` (line 68) and wraps every
slide body (line 596). Every route that renders slides goes through
`RenderSlide` (verified: `slides.index.tsx`, `slides.handout.tsx`,
`slides.handout-3up.tsx`, `slides.print.tsx`, and
`SlidePresenterPage`). Conclusion: there is no slide-rendering path
that bypasses `ThemeWrap`, so a single pipeline change in `ThemeWrap`
will hit every surface. Phase 3 (steps 12–17) can proceed with
confidence.

`SlideLayout.tsx` carries a deprecation note confirming background
ownership moved to `ThemeWrap`. Do not re-introduce per-slide bg in
SlideLayout.

## Step 4 — Music pipeline (audit deferred to step 18)

`MusicToggle` is rendered inside `SlidePresenterPage` (re-mounts on
param change, see 2.3). Audit work for step 18 will confirm whether a
module-scope `HTMLAudioElement` already exists; if not, hoist it.

## Step 5 — Controller mount (audit deferred to step 22)

`ControllerPill` is currently inside `SlidePresenterPage`. Hoisting in
step 8 (PresenterShell into `slides.$slideId.tsx`) also resolves
step 22 (mount once per session).

## Step 6 — Keyboard ownership (audit deferred to step 26)

Single owner today is `SlidePresenterPage`. `SHORTCUTS` registry exists
in `shortcuts.ts`; presenter still hand-rolls a few keys. Step 26 will
generate the handler from `SHORTCUTS`.

## Decisions

- Step 7 (single fullscreen target) — **already satisfied**; no work.
- Step 8 (survive route-param nav) — **scheduled next**; hoist
  `PresenterShell` into `slides.$slideId.tsx` so Controller/Settings/
  Music/Shortcuts persist across `/N` ↔ `/N/S`.
- Step 9 (embedded-popup fallback) — already covered by tests; smoke
  re-verify after step 8.

## Open questions still blocking later phases

- Q2 (dark preset overrides per-slide bg?) — pending user.
- Q3 (per-slide music override in B21?) — pending user.
