# Plan

## Active

### B21 — Settings / Music / Background / Controller / Fullscreen repair (30 steps)

Scope: the user reports that fullscreen forward-nav is now fixed *except on
one page* (current route at capture time: `/` home — also re-verify
`/slides/:id/:step`, `/slides/handout`, `/slides/handout-3up`, `/slides/print`,
`/slides/spec`). Settings (background color, dark, image, darken, blur),
music toggle, and the controller pill must visibly work end-to-end. Follow
`.lovable/coding-guidelines.md`: functions ≤ 8 lines, no `any`, no magic
strings, semantic tokens only, co-located vitest tests.

Source specs:
- `.lovable/memory/diagnostics/01-slide-settings-fullscreen-camera-rca.md`
- `docs/slides/spec/present-fullscreen.spec.md`
- `docs/slides/fullscreen-present-fallback.spec.md`
- `spec/old-slides/camera-2026/*`
- `spec/old-slides/controller-2026/*`
- `spec/old-slides/27-slides-number/*`
- `.lovable/memory/specs/03-audio-mapping.md`

#### Phase 1 — Root-cause analysis (steps 1-6, no code)

1. **Reproduce "this page" fullscreen failure.** Open `/`, `/slides/1`,
   `/slides/1/2`, `/slides/handout`, `/slides/handout-3up`, `/slides/print`,
   `/slides/spec`. Record which route(s) fail to enter fullscreen, which
   fail to *advance* once fullscreen, and the console/toast output. Write
   findings to `.lovable/memory/diagnostics/02-fullscreen-and-settings-rca.md`.
2. **Audit fullscreen owners.** Grep `enterFullscreen`, `requestFullscreen`,
   `useFullscreen`, `isEmbeddedWindow`. Confirm there is exactly one
   fullscreen target (`document.documentElement`). Flag any route that
   wraps fullscreen on a route-owned node (which gets unmounted on
   `$slideId/$step` param change → exits fullscreen).
3. **Audit Settings → background pipeline.** Trace `SettingsDrawer` →
   `useDeck` → `ThemeWrap` → `resolveBackground`. Verify every render path
   (`/slides/:id`, `/slides/:id/:step`, presenter, handout, print) wraps in
   `ThemeWrap`. Note any path that bypasses it.
4. **Audit music pipeline.** Trace `MusicToggle` → audio store → playback.
   Confirm: single `HTMLAudioElement`, stop-before-play, `volume` from
   settings, autoplay-blocked recovery via user gesture.
5. **Audit ControllerPill visibility.** Verify it mounts on every slide
   route, hides on `/`, survives fullscreen `fullscreenchange`, and its
   anchor cycling persists to `chrome-store`.
6. **Audit keyboard handler ownership.** Confirm `SHORTCUTS` is the single
   source of truth; identify any bespoke `keydown` handler still in
   `SlidePresenterPage` that bypasses the registry.

#### Phase 2 — Fullscreen hardening (steps 7-11)

7. **Single fullscreen target.** In `useFullscreen.enterFullscreen`, always
   target `document.documentElement` regardless of the `target` arg; keep
   `target` only for the visual shell class. Add a regression test in
   `src/components/slides/useFullscreen.test.ts` asserting param-route
   navigation does not exit fullscreen.
8. **Survive route-param navigation.** Ensure `slides.$slideId.$step.tsx`
   and `slides.$slideId.index.tsx` share the same persistent wrapper
   element (`PresenterShell` mounted under `slides.tsx` layout) so the
   fullscreen node never unmounts. If `slides.tsx` re-renders children
   on param change, hoist the shell into the layout route.
9. **Embedded-preview fallback verification.** Re-run the
   `embedded-popup-blocked` path: confirm the `PresenterFallbackLink` shows
   with a clickable "Open presenter window" link, and the URL includes
   `?present=1`.
10. **Home-page Present entry.** Decide whether `/` should expose a
    "Present" button (currently it does not). If yes, mount a minimal
    presenter launcher on `/` that opens `/slides/1` then triggers
    fullscreen on a user gesture. Otherwise document the non-issue.
11. **Cursor + Escape lock.** Re-verify Keyboard Lock for `Escape` and
    cursor auto-hide after 2.5s of idle in fullscreen. Add a test for the
    idle timer.

#### Phase 3 — Settings really applies (steps 12-17)

12. **Background color single pipeline.** In `ThemeWrap`, when
    `settings.backgroundMode === "color"`, override `--slide-bg`
    inline. Already partially done — verify every slide route reaches
    `ThemeWrap` (handout/print included). Add `themeWrap.test.tsx`.
13. **Dark background preset.** Add `backgroundMode: "dark"` preset that
    forces `--slide-bg` to the dark token and `--slide-fg` to the light
    token, independent of theme. Wire SettingsDrawer toggle.
14. **Background image mode.** Render `settings.backgroundImage` as a
    dedicated `<div>` layer behind content with `background-size: cover`,
    `background-position: center`. Add an image URL input in
    SettingsDrawer with paste-to-apply.
15. **Darken overlay.** Add a black overlay with
    `opacity: settings.darken / 100` above the bg layer but below content.
    Visible in normal *and* fullscreen.
16. **Blur layer.** Apply `filter: blur(${settings.blur}px)` to the bg
    layer only (never to content). Clamp blur ≤ 24px to avoid layout cost.
17. **Settings persistence + reset.** Ensure all six settings persist
    under `riseup.settings.v2` and a "Reset to defaults" button restores
    them. Add `settingsStore.test.ts` covering corrupt-JSON fallback.

#### Phase 4 — Music really plays (steps 18-21)

18. **One audio instance.** Refactor `MusicToggle` to use a module-scope
    `HTMLAudioElement` singleton. Stop-before-play on every toggle.
19. **Autoplay-block recovery.** If `play()` rejects, surface a toast
    "Tap to enable music" and arm a one-shot `pointerdown` listener that
    retries.
20. **Volume from settings.** Wire `settings.musicVolume` (0-100) to
    `audio.volume`. Add slider in SettingsDrawer.
21. **Per-slide music override.** Honor `slide.sound.music` per spec
    `03-audio-mapping.md`. Cross-fade 300ms when the URL changes between
    slides. Add `musicPlayback.test.ts`.

#### Phase 5 — Controller really works (steps 22-26)

22. **Mount audit.** Ensure `ControllerPill` is rendered exactly once,
    inside the `slides.tsx` layout, with `position: fixed` so it survives
    fullscreen + route-param changes.
23. **Anchor cycling persistence.** `b` cycles anchor among
    `bottom-center | bottom-right | bottom-left | top-right`; persist to
    `riseup.controller.anchor`. Add `controller-anchor.test.ts`.
24. **Collapsed hover-reveal.** Implement collapsed pill with
    160ms hover/focus expand and 400ms grace before collapse. Stay open
    while a child menu (Share/Settings/Help) is mounted.
25. **Overflow menu.** Move secondary actions (Theme, Music, Help,
    Settings) behind a "⋯" overflow menu on widths < 1280px.
26. **Single keymap.** Generate the controller handler and
    `KeyboardShortcutsDialog` from `SHORTCUTS`. Remove the bespoke handler
    in `SlidePresenterPage`. Add `shortcuts.contract.test.ts` asserting
    one-handler-per-key.

#### Phase 6 — Verify + memorize (steps 27-30)

27. **Cross-route e2e.** Playwright spec covering: enter fullscreen on
    `/slides/1`, advance to `/slides/2/3`, change background color, toggle
    music, exit. Assert fullscreen never drops mid-flow.
28. **Reduced-motion + a11y.** Verify every animated layer (overlay,
    blur, controller expand) respects `useReducedMotion()` and has an
    accessible label.
29. **Update RCA + memory.** Append "Resolution (B21)" section to
    `02-fullscreen-and-settings-rca.md`. Update `.lovable/memory/index.md`.
30. **Close pending tasks.** Mark resolved items in
    `.lovable/pending-issues/index.md` and remove duplicates from
    `.lovable/todo-tasks.md`.

#### Open questions (block step 1 until answered if blockers)

- Q1: The screenshot URL could not be parsed by the image fetcher.
  **Which exact route** is "this page" where fullscreen still fails? The
  current preview URL is `/`. If it is `/`, do you want Present from the
  home page, or should the report focus on `/slides/...`?
- Q2: Should the dark-background preset override per-slide
  `slide.background`, or defer to it?
- Q3: For music, is per-slide override required for B21, or is deck-level
  music enough?

## Pending (rolled in from previous batches)

### B20 — Camera/Controller 2026 (in progress)
Tasks 14-30 from `.lovable/camera-controller-2026-gap-tasks.md` remain.
B21 takes priority because it blocks user-visible Settings/Fullscreen.

### B19A — Settings / fullscreen / camera repair
Superseded by B21 (this plan). The RC1-RC6 fixes shipped; this batch fixes
the remaining route-specific fullscreen failure + missing settings wiring
(darken, blur, image, dark preset, music volume).

### B19 — Lint & CI polish
- ⏳ theme-token contrast rule
- ⏳ deck export-zip CLI
- ⏳ CI workflow running `lint-deck.ts`
- ⏳ per-slide `sound` schema validation
- ⏳ LintPanel "Copy as JSON" button

## Completed

### B18 (6/10), B17, B16
See git history + `.lovable/memory/workflow/01-current-batch.md`.
