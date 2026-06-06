# Camera 2026 — 20-step completion plan

Source of truth: `spec/old-slides/camera-2026/` only (00–14). The 30-step spec is folded into 20 ordered, ship-ready steps. Each step lists the spec file it implements, the file(s) to touch, and the done-when signal. Nothing is left "pending" — the final step is full sign-off against the acceptance checklist.

## Current baseline (already in repo)

- `src/components/slides/usePresenterWebcam.tsx` — provider + state machine (~570 lines).
- `src/components/slides/controls/PresenterWebcamOverlay.tsx` — overlay mount (~150 lines).
- `src/components/slides/controls/CameraBubble.tsx` — primary surface (~540 lines).
- `src/components/slides/controls/CameraPlate.tsx` — squircle plate.
- `src/components/slides/autoFrame.ts` + `useAutoFrame.ts` + tests.
- `src/assets/camera-2026/02..04*.png` — squircle mask + 2 plates.
- Chrome scenes (`normal | split | cam-only | stage-fill`) in `chrome-store.ts`.

The plan finishes what is missing and reconciles the implementation with the spec.

## Phase A — State & persistence (steps 1–4)

1. **Audit state machine vs spec 01** — open `usePresenterWebcam.tsx`, diff types & actions against `01-state-machine-and-hook.md` (phases `off|requesting|on|tray|fullscreen|stage|denied`, `SIZE_STEPS`, `STEP_ORDER`, refs `fullscreenReturnPhaseRef`, `actionStackRef`, `navHandlersRef`, `stageRestoreRef`). File a per-action diff list at the top of the file as a comment block. Done when every action in the spec is either ✅ present or ❌ flagged.
2. **Fill missing actions** — implement any ❌ from step 1: `hide`, `close`, `toggleMinimized`, `resizeFree`, `growSize/shrinkSize`, `enterStage`, `restoreFromSnapshot`, `dispatchPassthrough(dir)`, `runCinematicCycle`. Wire `stopStream` on `close`. Done when `usePresenterWebcam.test.tsx` covers each new action.
3. **localStorage keys** — confirm all spec keys exist (`POS_KEY`, `SIZE_KEY`, `HALO_KEY`, `CIRCLE_KEY`, `AUTOFRAME_KEY`, `PLATE_KEY`); add SSR guards + corrupt-JSON fallbacks. Done when a unit test that writes `"{"` then reads returns defaults.
4. **Provider mount audit** — confirm `<PresenterWebcamProvider>` wraps the router in `src/router.tsx`/`__root.tsx` (spec calls for `src/App.tsx`; this stack uses TanStack Start so wrap in `__root.tsx`). Done when `usePresenterWebcam()` throws outside the tree and works inside any route.

## Phase B — Overlay surfaces (steps 5–8)

5. **Four-surface router (spec 02 §1)** — in `PresenterWebcamOverlay.tsx`, branch on phase: `on → <CameraBubble/>`, `tray → <CameraTray/>`, `fullscreen → <CameraFullscreen/>`, `stage → <CameraStageFill/>`. Early-return `null` for `off|requesting|denied`. Done when DOM shows exactly one surface per phase.
6. **Stream binding (spec 02 §3)** — extract `attachStreamToVideo` helper; ensure both floating and fullscreen `<video>` re-bind via a ref-effect; never `srcObject = null` mid-transition. Done when a Vitest with a fake `MediaStream` shows the same track instance survives `on → fullscreen → on`.
7. **Drag + resize math (spec 02 §2)** — pointer-capture + `delta / --stage-scale → setPosition`; width-only resize handle, 16:9 derived, clamp `[160, 960]`, `stopPropagation` on the handle. Done when manual drag at 50% zoom moves bubble in true stage coords.
8. **Tray + stage-fill surfaces (spec 02 §5, 15)** — 40×40 ember-pulse tray with hover-fan (Expand / Fullscreen / Stop); stage-fill covers full 1920×1080 with `stageRestoreRef` round-trip. Done when `1` toggles into stage-fill and `Esc` restores prior size+position exactly.

## Phase C — Shortcuts & nav passthrough (steps 9–12)

9. **Core keymap (spec 03 §2)** — register `i`, `m`, `f`, `+`, `-`, `Esc`, `h`, `1` with modifier + `isEditableTarget` guard. Route through the existing `SHORTCUTS` registry so the `/` dialog auto-lists them. Done when `KeyboardShortcutsDialog` shows all 8 rows under "Camera".
10. **v5 keys (spec 03 §1)** — add `O` (circle/rect toggle), `P` (enter fullscreen), `[` (exit fullscreen), `]` (`runCinematicCycle`: play `whoosh` from `audio.ts`, 0.8 s squish; reduced-motion = instant). Done when reduced-motion media-query test asserts no animation runs.
11. **Fullscreen nav passthrough (spec 02 §6)** — capture-phase keydown that forwards arrow/space/PgUp/PgDn as `riseup:webcam-passthrough` CustomEvent with `{detail:{dir:'next'|'prev'}}`; set `window.__riseupWebcamLastAction` so Back works. Done when listener fires while camera fullscreen has focus.
12. **Deck wiring (spec 06 step 20)** — in the slide presenter route, `registerNavHandlers({goNext, goPrev})` on mount and `addEventListener(WEBCAM_PASSTHROUGH_EVENT, …)` mapped to those handlers. Done when pressing → while camera fullscreen advances the slide.

## Phase D — Auto-frame (steps 13–14)

13. **Detection loop (spec 04 §4)** — in `useAutoFrame.ts` confirm: offscreen `<video>` + 320 px `<canvas>`, 250 ms tick, largest face, EMA α=0.18, zoom to 0.55 height ratio, ease-back on loss. Feature-detect `window.FaceDetector`; no-op + log once on Safari/FF. Done when `useAutoFrame.test.ts` asserts `unsupported` path returns identity transform.
14. **Wire `f` toggle + transform (spec 04 §1)** — apply `objectPosition` and `transform: scale(z)` to the `<video>` honoring mirror state. Persist enable flag to `AUTOFRAME_KEY`. Done when toggling `f` updates the bubble live with no remount.

## Phase E — Plates, shape, polish (steps 15–18)

15. **Squircle clip (spec 05 §3, §8)** — keep `border-radius: 38% / 34%` fallback **and** apply `mask-image: url(/src/assets/camera-2026/02-squircle-mask-black.png) 100% 100%` on the clipping wrapper (not the `<video>`); `O` overrides to `border-radius:50%`; tray puck stays `999px`. Done when `CameraBubble.shape.test.tsx` covers all three shapes.
16. **Two-layer plate stack (spec 05 §2, §5)** — render plates inside `CameraPlate.tsx` sized `boxW + 2*platePad` with `platePad = round(boxW*0.07)`: white shadow plate `z:0`, gold plate `z:1`, video frame `z:2`. All plates `pointer-events:none`. Done when DOM shows 3 stacked layers and bubble visually matches `01-reference-frame-gold-rim.png`.
17. **Gold→ember rim + halo (spec 05 §4, §7)** — tokenise frame border + glow with `--gold` and `--background`; `h` toggles a vignette behind the bubble. No inline hex anywhere; verify against light theme (paper-ink). Done when `rg "#[0-9a-fA-F]{3,6}" src/components/slides/controls/CameraBubble.tsx` returns 0 matches.
18. **Shape-pop animation (spec 02 §4)** — WAAPI on the clipping wrapper only, not on `<video>`; bail under `useReducedMotion()`. Done when toggling `O` does not flash the video and reduced-motion env shows no animation.

## Phase F — Controller, tests, sign-off (steps 19–20)

19. **Controller chip + dropdown (spec 03 §3–§5)** — ensure `ControllerPill` exposes a `PresenterWebcamButton` chip with status icon/colour (off=ghost, requesting=spin, on=ember, denied=red), plus dropdown items: Show/Hide, Fullscreen, Auto-frame, Halo, Stage-fill, Circle/Rect, Plate variant, Stop. Done when chip parity test (`presenterActions.ts` registry) lists every camera action exactly once.
20. **Acceptance run (spec 07 + 11/12/13)** — execute `T01–T30` checklist: phase transitions, drag, resize, fullscreen, stage-fill round-trip, autoframe on Chromium / no-op on Safari, halo, plate variants, shortcut dialog, nav passthrough, reduced-motion, no inline hex, light/dark theme contrast. Update `mem://features/webcam-halo-and-stage`. Done when every T-row in `11..13-test-execution-steps-*.md` is ✅ and `bunx vitest run src/components/slides` is green.

## Notes

- All file paths above match the current repo layout (`src/components/slides/...`), not the spec's legacy `src/slides/...` paths. The spec text is the contract; the file locations are this stack's.
- Steps 1–4 must land before Phase B because every surface reads context/state added there. Phases B–E can each be opened as one PR.
- "Nothing pending" means: after step 20, every behaviour in `00..05` + every checklist row in `07` is implemented and tested. No TODOs, no `@ts-ignore`, no inline hex.
