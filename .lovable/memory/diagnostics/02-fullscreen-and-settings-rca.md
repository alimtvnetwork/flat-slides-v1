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

## Step 18 — One audio instance

Root cause: deck music playback lived in `useDeckMusic()` as a component-local
`useRef<HTMLAudioElement | null>`. Presenter/control remounts could therefore
create, pause, or discard separate audio elements instead of sharing one
presenter-wide music player.

Fix: added `deckMusicPlayer.ts` with a module-scope `HTMLAudioElement`
singleton. `useDeckMusic()` now only configures that singleton and toggles
playback state. Every play request calls `stopDeckMusic()` first, which pauses
and rewinds before `play()`, so rapid toggles cannot stack overlapping music.

Verified: `bunx vitest run src/components/slides/deckMusicPlayer.test.ts src/components/slides/settingsStore.test.ts`
passes 5/5 tests, including singleton reuse and stop-before-play behavior.

## Step 19 — Autoplay-block recovery

Root cause: `setDeckMusicPlaying(true)` swallowed `audio.play()` rejections
with a single `console.warn`. Browsers reject with `NotAllowedError` when
playback starts without a user gesture, so users who toggled music on the
home/present route saw no audio and no signal explaining why.

Fix: `setDeckMusicPlaying` now returns `Promise<PlayResult>` and
distinguishes `NotAllowedError` (autoplay block) from other failures. A new
`deckMusicAutoplayRecovery.ts` shows a sonner toast ("Tap to enable music")
and arms a one-shot `pointerdown` listener that retries `setDeckMusicPlaying(true)`.
`useDeckMusic` invokes the recovery only when the play promise resolves to
`{ ok: false, blocked: true }`, and disposes the listener + toast on
cleanup so route changes do not leak handlers.

Verified: `bunx vitest run src/components/slides/deckMusicPlayer.test.ts`
passes 3/3, including the new `NotAllowedError` → `{ ok: false, blocked: true }` case.

## Step 20 — Volume from settings

Root cause: background music still read `chrome.music.volume` (0–1), a
presenter-local control, while B21 requires persisted deck settings to own music
gain as `settings.musicVolume` (0–100). That split meant the Settings reset and
`riseup.settings.v2` persistence path did not actually control background music.

Fix: added `musicVolume` to `DeckSettings`, schema defaults, sample deck, and the
settings persistence defaults. `useDeckMusic()` now reads
`deck.settings.musicVolume`, and `deckMusicPlayer` converts the percentage to
`HTMLAudioElement.volume`. SettingsDrawer exposes the music volume slider while
leaving `settings.volume` as the existing whoosh/click SFX gain.

## Step 21 — Per-slide music override + 300ms crossfade

Root cause: `useDeckMusic` only knew about `deck.music`, and `deckMusicPlayer`
swapped `audio.src` on the same element — there was no per-slide override and
no way to cross-fade between two URLs.

Fix: extended `BaseSlide.sound` with optional `music: { url, loop?, volume? }`
in `types.ts` and `schema.ts`. Added transient `slideMusic` + `setSlideMusic`
to `chrome-store` (non-persisted). `SlidePresenterPage` writes the active
slide's override on slide change. `useDeckMusic` resolves
`override ?? deck.music` and feeds that to `configureDeckMusic`.

`deckMusicPlayer` was refactored to a two-`Audio` model: when the URL changes
while `isPlaying`, a fresh `Audio` is created at `volume: 0`, started, and a
`setInterval` ramps the old element from `targetGain → 0` and the new from
`0 → targetGain` over `CROSSFADE_MS = 300` (6 ticks). When `!isPlaying`, the
swap is silent and just replaces `active`.

Verified: `bunx vitest run src/components/slides/musicPlayback.test.ts
src/components/slides/deckMusicPlayer.test.ts
src/components/slides/settingsStore.test.ts` passes 10/10, including:
crossfade volume math at `CROSSFADE_MS`, no crossfade when paused, and
clean revert to deck music when the override clears.

## Step 22 — Controller mount audit

Audit: `ControllerPill` is mounted exactly once in `SlidePresenterPage`,
which itself is hoisted into the `slides.$slideId.tsx` layout (step 8). The
pill renders with `position: fixed` and portals into the slides fullscreen
root (`getSlidesPortalRoot()`), so it survives both `/N` ↔ `/N/S` route-param
transitions and native fullscreen target swaps. `slides.tsx` is deliberately
NOT the mount point — handout/print/overview routes share that layout and
must not render the presenter controller.

Regression: added `controls/ControllerPill.mount.test.tsx` asserting
exactly one `[aria-label="Slide controller"]` after rerenders simulating
`/N ↔ /N/S` prop changes, that the toolbar is `position: fixed`, and that
it portals into the slides fullscreen root when present. 3/3 pass.

## Step 23 — Controller anchor cycling persistence

Root cause: controller position still used the earlier eight-anchor helper and
persisted under `slides-controller-pos-v2`; B21 requires only
`bottom-center → bottom-right → bottom-left → top-right`, plus persistence under
`riseup.controller.anchor`. There was also no presenter-level `B` key handler,
so keyboard cycling was unavailable and the camera bubble could consume `B`.

Fix: narrowed `ControllerAnchor` to the four B21 anchors, added
`controller-anchor-store.ts` with `riseup.controller.anchor`, wired
`ControllerPill` to that store, and handled `B` in `SlidePresenterPage` before
camera shortcuts (`stopImmediatePropagation`) so the controller owns the key.
`KeyboardShortcutsDialog` now lists `B — Move controller` from `SHORTCUTS`.

Verified: `bunx vitest run src/components/slides/controls/controller-anchor.test.ts
src/components/slides/controls/ControllerPill.mount.test.tsx` passes 9/9,
including ordered cycling and required localStorage key persistence.

### Step 24 — Collapsed hover-reveal (B21)

Root cause: ControllerPill was always fully visible (opacity 1), which
fights with overlay UI and violates the B21 spec for a faint resting
state that reveals on intent.

Fix: extracted `useHoverReveal` (160ms expand intent / 400ms collapse
grace, stays open while any descendant has `data-state="open"`). Wired
to `ControllerPill` outer div via `onMouseEnter/Leave/Focus/Blur`; the
inner toolbar now animates `opacity` between 0.28 (collapsed) and 1
(expanded). Keyboard focus inside the pill auto-expands it, child
popovers/menus (Radix `data-state="open"`) hold it open.

Verified: `bunx vitest run src/components/slides/controls/useHoverReveal.test.ts
src/components/slides/controls/ControllerPill.mount.test.tsx` — 8/8.

### Step 25 — Overflow menu on narrow viewports (B21)

Root cause: at <1280px the toolbar wraps/overflows because Theme, Music,
Settings, Help all render inline alongside Grid/Fullscreen/Camera/Share.

Fix: added `useNarrowViewport` (matches `(max-width: 1279px)`) and
`ControllerOverflowMenu` (Radix DropdownMenu with `⋯` trigger,
`aria-label="More controls"`). When narrow, Theme/Music render inside
the menu's header strip and Settings/Help become menu items; when wide,
the original inline layout is preserved. Share stays inline at all sizes.

Verified: `bunx vitest run src/components/slides/controls/ControllerOverflowMenu.test.tsx
src/components/slides/controls/ControllerPill.mount.test.tsx
src/components/slides/controls/useHoverReveal.test.ts` — 10/10.
