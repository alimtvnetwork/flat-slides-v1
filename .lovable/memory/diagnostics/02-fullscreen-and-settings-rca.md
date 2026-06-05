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

## Step 9 — Embedded popup fallback resolution

Root cause: the slide presenter path used `useFullscreen.enter()`, which
reports `embedded-popup-blocked` into the chrome store and renders
`PresenterFallbackLink`. The home `Present deck` path called the lower-level
`enterFullscreen()` helper directly, so a blocked embedded popup produced only
navigation/failure behavior and did not mount the persistent fallback link on
`/`.

Fix: export `reportFullscreenFailure()`, call it from the home presenter
gesture with the home URL (`/slides/1?present=1`), mount
`PresenterFallbackLink` on `/`, and keep the user on home when the fallback
owns recovery. Regression coverage added for the blocked-popup store update
and home navigation decision.

Verified: `bunx vitest run src/components/slides/home-present.test.ts src/components/slides/fullscreenTarget.test.ts src/components/slides/controls/PresenterFallbackLink.test.tsx`
passes 11/11 tests.

## Step 12 — Background color single-pipeline resolution

Root cause: `RenderSlide` still resolved authored `slide.background` before
deck settings, so Settings → Background Color was not authoritative on
slides that already carried a per-slide background. That made the control
look broken even though `SettingsDrawer` and the deck store were updating.

Fix: move background resolution into `slideBackground.ts` and make
`backgroundMode: "color"` an explicit deck-level override. `ThemeWrap`
now writes `--slide-bg` to the selected color for color mode, while image
mode keeps content transparent so the unified background layer remains
visible. `RenderSlide` is still the only slide entrypoint, so presenter,
overview, handout, 3-up, and print routes all share the same pipeline.

Verified: `bunx vitest run src/components/slides/themeWrap.test.tsx`
passes 2/2 tests.

## Open questions still blocking later phases

- Q2 (dark preset overrides per-slide bg?) — pending user.
- Q3 (per-slide music override in B21?) — pending user.

## Step 13 — Dark background preset

Added a third `backgroundMode: "dark"` to `DeckSettings`, the deck schema,
and the SettingsDrawer mode toggle. `resolveSlideBackground` returns the
dark color override for the new mode, and `ThemeWrap` additionally rewrites
`--slide-fg`, `--slide-muted`, and `--slide-text-shadow` to a fixed light
preset so dark mode is authoritative regardless of the active theme (Snow,
Paper, etc.). Dark tokens live as module constants in `slideBackground.ts`
(`DARK_PRESET_BG = #0a0a0a`, `DARK_PRESET_FG = #fafafa`,
`DARK_PRESET_MUTED = #a3a3a3`) per guideline 8.

Verified: `bunx vitest run src/components/slides/themeWrap.test.tsx` passes
3/3 tests, including a `themeId: "paper"` slide rendered with dark mode.

## Step 14 — Background image mode

Root cause: image mode still let an authored per-slide `background` win before
`settings.backgroundImage`, so the Settings URL input could update the store
without changing slides that already had a background. The image input was also
always visible rather than tied to the active image mode.

Fix: `resolveImageMode()` now treats `settings.backgroundImage` as the deck-level
image override, before falling back to authored slide backgrounds or the deck
color. `ThemeWrap` already renders that resolved image through the dedicated
`data-slide-bg-layer` behind transparent content with `background-size: cover`
and `background-position: center`. `SettingsDrawer` now exposes the URL field
only in image mode and paste/change both immediately apply image mode.

Verified: `bunx vitest run src/components/slides/themeWrap.test.tsx` passes
4/4 tests, including settings image priority and bg layer sizing/positioning.

## Step 15 — Darken overlay

Root cause/status: `ThemeWrap` already rendered a pointer-events-none darken
overlay between the background layer and slide content, using
`clampDarkenPercent(settings.darken) / 100` for opacity. The missing piece was
regression coverage proving the overlay exists only when darken is above zero.

Verified: `themeWrap.test.tsx` covers `darken: 40` → `rgba(..., 0.4)` and
`darken: 0` → no overlay. The background pipeline remains single-path because
the overlay lives inside `ThemeWrap`.

## Step 16 — Blur clamp

Root cause/status: `clampBackgroundBlurPx()` already limited Settings blur to
the documented 0–20px range before `resolveBackgroundLayerStyle()` writes the
CSS `filter`. The missing piece was regression coverage proving oversized
settings cannot push unsupported blur values into the slide background layer.

Verified: `themeWrap.test.tsx` covers `blur: 80` in image mode and asserts the
rendered background layer filter is exactly `blur(20px)`.

## Step 17 — Settings persistence + reset

Root cause: deck settings were only persisted as part of the Zustand deck key
(`slides-deck-v1`). There was no independent settings persistence under the
required `riseup.settings.v2` key, and the only reset action restored the whole
sample deck rather than just the six user-facing settings.

Fix: added `settingsPersistence.ts` with default settings, safe parse/read/write,
corrupt-JSON fallback logging, and explicit persistence under
`riseup.settings.v2`. `setSettings()` now writes all settings to that key,
`resetDeck()` restores persisted defaults, and SettingsDrawer exposes a
dedicated "Reset settings" action.

Verified: `bunx vitest run src/components/slides/settingsStore.test.ts src/components/slides/themeWrap.test.tsx`
passes 10/10 tests, including all-setting persistence, reset-to-defaults, and
corrupt JSON fallback.
