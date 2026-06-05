# Camera 2026 + Controller 2026 Gap Tasks

Source specs:
- `spec/old-slides/camera-2026/README.md`
- `spec/old-slides/camera-2026/00-overview-and-architecture.md`
- `spec/old-slides/camera-2026/01-state-machine-and-hook.md`
- `spec/old-slides/camera-2026/02-overlay-rendering-and-surfaces.md`
- `spec/old-slides/camera-2026/03-shortcuts-and-controls.md`
- `spec/old-slides/camera-2026/04-autoframe-face-tracking.md`
- `spec/old-slides/camera-2026/05-backgrounds-and-shapes.md`
- `spec/old-slides/camera-2026/06-implementation-steps-1-30.md`
- `spec/old-slides/camera-2026/07-acceptance-checklist-and-tests.md`
- `spec/old-slides/controller-2026/README.md`
- `spec/old-slides/controller-2026/01-controller-100-steps.md`

Current implementation checked:
- `src/components/slides/controls/CameraBubble.tsx`
- `src/components/slides/useCamera.ts`
- `src/components/slides/useAutoFrame.ts`
- `src/components/slides/chrome-store.ts`
- `src/components/slides/controls/ControllerPill.tsx`
- `src/components/slides/controls/SlideIndicator.tsx`
- `src/components/slides/controls/MusicToggle.tsx`
- `src/components/slides/controls/KeyboardShortcutsDialog.tsx`
- `src/components/slides/shortcuts.ts`
- `src/components/slides/SlidePresenterPage.tsx`
- `src/styles.css`

## Root diff summary

The current app has a working lightweight `CameraBubble` and `ControllerPill`, but it does not fully implement the old spec packs. The biggest gaps are:

1. Camera lacks the spec's explicit phase state machine: `off/requesting/on/tray/fullscreen/stage/denied`.
2. Camera hide/close semantics are different: current `visible=false` stops the stream instead of supporting tray mode with stream alive.
3. Camera positioning is viewport-anchor based, not 1920×1080 stage-coordinate based with `--stage-scale` delta correction.
4. Camera fullscreen/stage modes are represented as global scene presets, not the spec's camera-owned CSS phases and round-trip restore.
5. Camera keyboard map is partial: `i`, `m` tray, `f` auto-frame, `h`, `1`, `[`, `]`, nav passthrough are missing or conflict with current shortcuts.
6. Camera auto-frame exists, but it uses `object-position` directly on the visible video, not the spec's persisted FaceDetector transform pipeline with EMA and hidden scratch sampling.
7. Camera squircle assets are present and partially used, but plate variants, tokenized rim/glow, halo, and cursor auto-hide contract are incomplete.
8. Controller exists, but it is always expanded; the spec requires collapsed hover-reveal with hit-area, grace delay, tooltips, and stable visibility while child menus are open.
9. Controller has anchor cycling, nav, jump, fullscreen, theme, music, share, help, settings; but it lacks overflow/hamburger menu, first-run story re-trigger, theme-from-color engine, and full keyboard shortcut behavior.
10. `SHORTCUTS` exists, but `SlidePresenterPage` still owns a bespoke handler; the handler and help dialog are not fully generated from one source of truth.

## 30 implementation tasks for the next pass

### Camera track — spec parity

1. **Create the spec-level camera state module.**
   - Spec: `camera-2026/01-state-machine-and-hook.md` §1–§3; `06-implementation-steps-1-30.md` steps 1–4.
   - Current gap: `useCamera.ts` only tracks `idle/requesting/active/denied/error`; `chrome-store.ts` only tracks visual options.
   - Target code: replace/extend `src/components/slides/useCamera.ts`; update `src/components/slides/chrome-store.ts` only for persisted visual prefs.
   - Done when: exported state supports `off | requesting | on | tray | fullscreen | stage | denied` and tests can read transitions.

2. **Add SSR-safe camera persistence helpers.**
   - Spec: `camera-2026/01-state-machine-and-hook.md` §2.
   - Current gap: Zustand persists camera state under `slides-chrome-v2`, but not spec keys like `riseup.webcam.pos`, `riseup.webcam.size`, `riseup.webcam.min`, `riseup.webcam.halo`, `riseup.webcam.circle`, `riseup.webcam.autoframe`.
   - Target code: `src/components/slides/useCamera.ts` or new `src/components/slides/usePresenterWebcam.tsx`.
   - Done when: corrupt localStorage falls back safely and no SSR read throws.

3. **Implement `show()` stream acquisition with friendly denied states.**
   - Spec: `camera-2026/01-state-machine-and-hook.md` §4.
   - Current gap: `useCamera.start()` requests 640×480 and maps only permission denial clearly.
   - Target code: `src/components/slides/useCamera.ts`.
   - Done when: camera requests ideal 1280×720, audio false, and `NotAllowedError`/`NotFoundError` produce user-safe messages.

4. **Separate soft hide/tray from hard close.**
   - Spec: `camera-2026/00-overview-and-architecture.md` §4; `01-state-machine-and-hook.md` §5; acceptance lifecycle.
   - Current gap: `CameraBubble` stops the stream whenever `camera.visible` becomes false.
   - Target code: `src/components/slides/useCamera.ts`, `src/components/slides/controls/CameraBubble.tsx`, `src/components/slides/chrome-store.ts`.
   - Done when: soft hide enters `tray` with tracks still alive; hard close stops every track and returns `off`.

5. **Move camera drag/resize into 1920×1080 stage coordinates.**
   - Spec: `camera-2026/00-overview-and-architecture.md` §5; `02-overlay-rendering-and-surfaces.md` §2.
   - Current gap: `CameraBubble` uses viewport fixed anchors and raw pointer deltas.
   - Target code: `CameraBubble.tsx`; maybe `src/styles.css` for `--stage-scale` if absent.
   - Done when: drag and resize deltas divide by `--stage-scale` and clamp inside the 1920×1080 stage.

6. **Implement stepped S/M/L/XL size plus free 16:9 resize.**
   - Spec: `camera-2026/01-state-machine-and-hook.md` §1, §8; `02-overlay-rendering-and-surfaces.md` §2.
   - Current gap: current sizes are `sm/md/lg`, custom size is square-ish by height, and rect width derives after the fact.
   - Target code: `useCamera.ts`, `CameraBubble.tsx`, `chrome-store.ts` migration.
   - Done when: `+/-` walk S→M→L→XL, free resize is width-driven 16:9, clamps `[160,960]`.

7. **Render the four camera surfaces.**
   - Spec: `camera-2026/02-overlay-rendering-and-surfaces.md` §1 and §5.
   - Current gap: only visible bubble / hidden null / scene-based enlarged modes exist; no tray icon surface.
   - Target code: `CameraBubble.tsx` or split into `PresenterWebcamOverlay.tsx` plus subcomponents.
   - Done when: `on`, `tray`, `fullscreen`, and `stage` each render distinct surfaces with correct `role="region"` labels.

8. **Implement camera CSS fullscreen and stage-fill round-trip.**
   - Spec: `camera-2026/00-overview-and-architecture.md` §4; `01-state-machine-and-hook.md` §6–§7; `02-overlay-rendering-and-surfaces.md` §6.
   - Current gap: `scene='stage-fill'` is global and does not restore camera phase/size/position atomically.
   - Target code: `useCamera.ts`, `CameraBubble.tsx`, `SlidePresenterPage.tsx` passthrough wiring.
   - Done when: `P` enters camera fullscreen CSS layer; `1` enters stage fill and a second `1`/Esc restores exact previous state.

9. **Add camera nav passthrough while camera fullscreen/stage is active.**
   - Spec: `camera-2026/02-overlay-rendering-and-surfaces.md` §6.
   - Current gap: deck owns arrow keys directly; there is no `riseup:webcam-passthrough` equivalent.
   - Target code: `CameraBubble.tsx`/camera state module and `SlidePresenterPage.tsx`.
   - Done when: camera fullscreen/stage capture keys dispatch next/prev to deck without exiting or double-firing.

10. **Complete the camera shortcut map.**
    - Spec: `camera-2026/03-shortcuts-and-controls.md` §1–§2.
    - Current gap: `C`, `Shift+C`, `O`, `P` exist in different meanings; `i`, soft `m`, auto-frame `f`, `h`, `1`, `[`, `]` are missing or conflicting.
    - Target code: `SlidePresenterPage.tsx`, `src/components/slides/shortcuts.ts`, camera hook.
    - Done when: input guards hold, shortcuts match the spec or are explicitly reconciled with existing deck shortcuts.

11. **Upgrade auto-frame to the spec transform pipeline.**
    - Spec: `camera-2026/04-autoframe-face-tracking.md`.
    - Current gap: `useAutoFrame.ts` returns `objectPosition`; spec requires persisted enable flag, hidden sampling, EMA, mirror-aware transform, lost-face reset.
    - Target code: `src/components/slides/useAutoFrame.ts`, `CameraBubble.tsx`, tests.
    - Done when: unsupported browsers return identity, supported mode tracks smoothly, and `f` toggles only when supported.

12. **Add camera halo and tokenized rim/glow controls.**
    - Spec: `camera-2026/01-state-machine-and-hook.md` §9; `05-backgrounds-and-shapes.md` §4, §7.
    - Current gap: there are plates and borders, but no independent halo toggle and several colors are raw/inline.
    - Target code: `chrome-store.ts`, `CameraBubble.tsx`, `src/styles.css`, `shortcuts.ts`.
    - Done when: `h` toggles halo independently, visual color is tokenized, reduced-motion respected.

13. **Finish plate variant and squircle background behavior.**
    - Spec: `camera-2026/05-backgrounds-and-shapes.md` §2–§8.
    - Current gap: mask and white/gold PNGs are used for `squircle`, but no persisted `plateVariant: none|neutral|gold`, no CSS fallback/rim option, and no acceptance tests around z-order/sizing.
    - Target code: `CameraBubble.tsx`, `chrome-store.ts`, `src/components/slides/controls/CameraBubble.shape.test.tsx`.
    - Done when: platePad is proportional, z0/z1/z2 verified, circle bypasses mask/plate cleanly.

14. **Implement camera cursor auto-hide.**
    - Spec: `camera-2026/02-overlay-rendering-and-surfaces.md` §8.
    - Current gap: no `useAutoHideCursor`, no `cam-cursor-hidden` class, no immediate hide after drag/resize.
    - Target code: new `src/components/slides/useAutoHideCursor.ts`, `CameraBubble.tsx`, `src/styles.css`.
    - Done when: cursor hides after idle and immediately after drag/resize, only wakes from camera-surface activity.

15. **Add camera regression tests.**
    - Spec: `camera-2026/07-acceptance-checklist-and-tests.md`.
    - Current gap: only shape and auto-frame basics are tested.
    - Target code: new/updated `src/components/slides/*camera*.test.tsx`.
    - Done when: tests cover close stops tracks, tray keeps stream, stage restore, video stability, shortcuts, plate z-order, and cursor auto-hide.

### Controller track — spec parity

16. **Refactor controller anchor names and contract.**
    - Spec: `controller-2026/01-controller-100-steps.md` steps 11–22.
    - Current gap: `controller-anchor.ts` supports 8 anchors with lowercase names and right-click cycling, but no explicit tooltip side/expand direction contract.
    - Target code: `src/components/slides/controls/controller-anchor.ts`, `ControllerPill.tsx`, tests.
    - Done when: all 8 anchors have safe-area offsets, expand direction, tooltip side, and documented default.

17. **Implement collapsed hover-reveal controller.**
    - Spec: `controller-2026/01-controller-100-steps.md` steps 23–36.
    - Current gap: `ControllerPill` is always expanded despite the comment saying hover-reveal.
    - Target code: `ControllerPill.tsx`, `src/styles.css` if needed.
    - Done when: collapsed chip is default, hover zone expands, pointer-leave grace delay collapses, reduced-motion snaps.

18. **Add accessible tooltips for every chip.**
    - Spec: controller steps 16, 29, 99.
    - Current gap: most buttons use only `aria-label`; some use native `title`; no consistent tooltip side based on anchor.
    - Target code: `ControllerPill.tsx`, possibly existing `src/components/ui/tooltip.tsx`.
    - Done when: keyboard/mouse users get labels, tooltips open away from edges, no focus trap.

19. **Add overflow/menu surface for presenter commands.**
    - Spec: `controller-2026/01-controller-100-steps.md` steps 28, 31, 33, 67, 77.
    - Current gap: controller has discrete chips but no hamburger/overflow menu and no “Show intro again”.
    - Target code: `ControllerPill.tsx`, `KeyboardShortcutsDialog.tsx`, `OnboardingCoachmark.tsx`.
    - Done when: menu exposes keyboard map, intro re-trigger, camera shape/stage/halo, theme, music, and settings without duplicating logic.

20. **Make `SHORTCUTS` the real handler source of truth.**
    - Spec: controller steps 57–68; camera spec file 03 §4–§5.
    - Current gap: `SHORTCUTS` feeds the dialog, but `SlidePresenterPage.tsx` hardcodes behavior separately.
    - Target code: `src/components/slides/shortcuts.ts`, new `useSlideShortcuts.ts` or refactor inside `SlidePresenterPage.tsx`.
    - Done when: shortcut rows and handler cannot drift, and tests verify each bound key.

21. **Implement missing controller keyboard features.**
    - Spec: controller steps 58–61.
    - Current gap: no Backspace previous, no digit-buffer quick jump, no `/` specifically opens help separate from `?`, fullscreen is F5 not F, and F conflicts with focus editor.
    - Target code: `SlidePresenterPage.tsx`, `shortcuts.ts`, `KeyboardShortcutsDialog.tsx`.
    - Done when: final key contract is explicit, tested, and reconciled with current F/focus-editor behavior.

22. **Complete first-run onboarding story.**
    - Spec: controller steps 69–78; `controller-2026/11-build-substeps-C07.md`.
    - Current gap: `OnboardingCoachmark.tsx` exists but appears not mounted, is hardcoded, not rendered from `SHORTCUTS`, not multi-step, and no menu re-trigger.
    - Target code: `SlidePresenterPage.tsx`, `OnboardingCoachmark.tsx`, `useOnboardingFlag.ts`, `ControllerPill.tsx`.
    - Done when: popup shows once, uses `SHORTCUTS`, dismisses correctly, and can be reopened from menu.

23. **Improve slide jump input and recent jumps against spec.**
    - Spec: controller steps 40–48.
    - Current gap: `SlideIndicator` is close, but out-of-range invalid input silently cancels; no explicit clamp/feedback; recent dropdown may need anchor-aware placement.
    - Target code: `SlideIndicator.tsx`, `chrome-store.ts`, tests.
    - Done when: Enter clamps or clearly rejects per final decision, Esc/blur cancel, and recent jumps are tested.

24. **Finish fullscreen controller behavior.**
    - Spec: controller steps 49–56.
    - Current gap: native fullscreen works, but cursor auto-hide for the deck/controller itself is not implemented; unsupported fallback exists only via presenter window logic.
    - Target code: `useFullscreen.ts`, `ControllerPill.tsx`, `PresenterShell.tsx`, `src/styles.css`.
    - Done when: enter/exit/re-enter are tested, controller hover works in fullscreen, idle cursor behavior is defined.

25. **Build theme-from-color engine.**
    - Spec: controller steps 79–90.
    - Current gap: `ThemeChip` cycles fixed deck themes; no `createThemeFromColor(hex, mode)`, contrast-picked foreground, global/per-deck priority, or color picker preview.
    - Target code: `src/components/slides/themes.ts`, `ThemeChip.tsx`, store/theme helpers.
    - Done when: HSL tokens derive from a brand color, persist with URL/per-deck/global priority, and include 2–3 examples.

26. **Complete background music feature.**
    - Spec: controller steps 91–98.
    - Current gap: `MusicToggle` and `useDeckMusic` exist, but no track selector/examples, no volume popover in compact mode, and fade behavior needs verification.
    - Target code: `MusicToggle.tsx`, `useDeckMusic.ts`, `chrome-store.ts`, assets if tracks are added.
    - Done when: music is always gesture-started, persists prefs but not autoplay, fades respecting reduced-motion, and has demonstrable tracks or documented no-track behavior.

27. **Audit controller z-index and portal layering with camera.**
    - Spec: controller steps 5, 8, 35; camera overlay specs.
    - Current gap: z-index was recently raised to fix click delivery; now needs a documented stack for controller, camera, dialogs, and fullscreen root.
    - Target code: `src/styles.css`, `ControllerPill.tsx`, `CameraBubble.tsx`, `PresenterShell.tsx`.
    - Done when: controller, camera, settings, dialogs, and fullscreen cannot occlude each other incorrectly.

28. **Add controller regression tests.**
    - Spec: controller steps 21, 48, 56, 68, 78, 99.
    - Current gap: some anchor/shortcut tests exist, but not hover reveal, menu, onboarding re-trigger, quick jump buffer, or all 8 positions.
    - Target code: `src/components/slides/controls/*.test.tsx`, `src/components/slides/shortcuts*.test.ts`.
    - Done when: tests cover anchor geometry, collapsed/expanded state, nav/jump bounds, shortcuts/input guards, onboarding, and a11y labels.

29. **Run an end-to-end presenter story QA pass.**
    - Spec: controller step 100; camera acceptance checklist.
    - Current gap: pieces have been tested in isolation, not as the combined story.
    - Target code/route: `/slides/1`, `/slides/3`, fullscreen mode, camera on/tray/fullscreen/stage, controller menu/help/theme/music.
    - Done when: presenter can open deck, navigate, jump, fullscreen, use camera, use menu/help, reload, and continue from the same URL.

30. **Update project memory and mark the spec packs as implemented.**
    - Spec: camera acceptance pre-flight and controller final sign-off.
    - Current gap: project memory still only covers routing/motion; it does not record final camera/controller shortcut contracts.
    - Target files: `mem://features/slides-motion-and-focus` or a new camera/controller memory, plus `.lovable/plan.md` and this task file.
    - Done when: future agents know the final keyboard, camera phase, controller hover, and z-index contracts.

## Implementation rule

Do not start coding these tasks until the user says `start implementing`. When implementation begins, execute in order unless a dependency forces a smaller prerequisite first.