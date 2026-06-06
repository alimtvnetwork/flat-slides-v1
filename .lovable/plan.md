# Plan — Image samples in JSON, white text, settings fix, full camera-2026 parity

Source specs:
- `spec/old-slides/camera-2026/` (all files, 00–10)
- `.lovable/camera-controller-2026-gap-tasks.md`
- `docs/slides/spec/llm-json-guideline.md`, `docs/slides/spec/sample-deck.json`

## Scope (user's 4 asks, mapped to 20 steps)

A. Slide JSON gains image samples: **left, right, center**, both **URL** and **base64** variants; the deck loader renders them from JSON.
B. Slide text color corrected to white (theme token, not raw hex).
C. Settings drawer audited/fixed.
D. Camera-2026 spec fully implemented from the `spec/old-slides/camera-2026/` folder — nothing left pending in the gap-tasks file.

The user will issue `next` ×20. One step per turn.

---

## Steps

### Track A — Image samples in JSON (steps 1–4)

1. **Audit current `image` / `left` / `right` / `center` slide types + media schema.** Read `src/components/slides/types.ts`, the renderers (`Slide*.tsx`), and `docs/slides/spec/llm-json-guideline.md` §media. Confirm `media.src` already accepts URL + `data:` base64. Note what's missing for explicit `align: "left" | "right" | "center"` on image slides.
2. **Extend the deck schema for image placement.** Add `media.align` (default `center`) and document URL vs `data:image/...;base64,...` usage in `llm-json-guideline.md`. Update `types.ts` and any Zod/runtime validation.
3. **Render `align` in `image`/`left`/`right`/`center` slides.** Update slide components to honor `media.align` (image floats left, right, or full-width center). Lazy-load URL images; render base64 inline.
4. **Add 3 image sample slides to `docs/slides/spec/sample-deck.json`.** One left-image (URL), one right-image (URL), one center-image (base64 inline — small SVG-as-data-URL is fine). Verify the deck loader picks them up by running the deck JSON loader test.

### Track B — Text color to white (step 5)

5. **Fix slide text color to white via design tokens.** Replace any stray `text-black`/`text-gray-*`/hex colors inside `.slide-content` with `hsl(var(--slide-foreground))` (or equivalent) and set the dark-theme `--slide-foreground` to white in `src/styles.css`. Re-run `lint-batch*` tests and visual QA one slide.

### Track C — Settings fix (steps 6–7)

6. **Reproduce the settings bug.** Open `SettingsDrawer.tsx` + `useHydratedDeckSettings.ts` + `settingsPersistence.ts`. Run `settingsStore.test.ts`. Identify the failing/broken control (likely volume, music, or transition not persisting/hydrating).
7. **Patch the bug at the source** (not the symptom), add a regression test in `settingsStore.test.ts`, and verify the drawer round-trips every field across reload.

### Track D — Camera-2026 spec parity (steps 8–20)

Map directly onto `.lovable/camera-controller-2026-gap-tasks.md` items + spec files 00–07.

8. **Wire `PresenterWebcamProvider` into the live app.** Spec 06 step 8. Confirm it's mounted in `src/App.tsx` or the slides shell and that `useCamera.ts` (legacy) no longer owns visibility for the presenter overlay.
9. **Replace `CameraBubble` viewport anchoring with stage-coordinate render.** Spec 02 §2. Drag/resize deltas divide by `--stage-scale`; clamp inside 1920×1080. Migrate any leftover viewport math out of `CameraBubble.tsx`.
10. **Migrate legacy `chrome-store` camera prefs to `riseup.webcam.*` keys.** Spec 01 §2. Ensure `chrome-store` no longer owns camera visual prefs; one-shot migrator reads old keys, writes new keys, deletes old.
11. **Auto-frame: FaceDetector + EMA pipeline persistence.** Spec 04 §2–§5. Replace `object-position` shortcut with the spec's offscreen-canvas sample → EMA α=0.18 → transform applied via WAAPI. Persist `riseup.webcam.autoframe`.
12. **Controller: collapsed hover-reveal with grace delay.** Spec controller-2026 §collapsed-hover. Replace always-expanded `ControllerPill` with hover hit-area + 250ms grace; remains visible while a child menu is open.
13. **Controller: overflow / hamburger menu under 1280px.** Already partially done per memory `presenter-controller-pill`; finish overflow items + first-run story re-trigger menu entry.
14. **Single keymap source of truth.** Spec 03 + memory `presenter-controller-pill`. Remove bespoke handler in `SlidePresenterPage`; route every key through `SHORTCUTS` → `presenterActions.ts`. Verify parity test still green.
15. **Cursor auto-hide contract.** Spec 02 §cursor. Auto-hide after 1.5s idle in fullscreen/stage; reveal on any pointer move; respect `prefers-reduced-motion` (no animated fade).
16. **Plate variant selector UI in settings.** Spec 05 §plate-variants. Wire `plateVariant: none | neutral | gold` into `SettingsDrawer` (or controller menu) — already persisted by `cyclePlateVariant`; just expose the picker.
17. **Theme-from-color engine for camera rim/glow.** Spec 05 §4 + controller-2026 theme engine. Derive `--gold` rim from current `--slide-accent` so the rim re-tints when the theme changes.
18. **First-run story re-trigger.** Spec controller-2026. Add menu entry to replay the camera-intro story; persist `riseup.controller.firstRun` flag.
19. **Full acceptance run against spec 07 checklist.** Walk every checkbox in `07-acceptance-checklist-and-tests.md` §1 manually on `/slides/1` and `/slides/inspector/1`. File any miss as a follow-up task.
20. **Close out `.lovable/camera-controller-2026-gap-tasks.md`.** Mark every gap-task resolved with file:line refs, run the full slide+camera vitest suite, and update memory `presenter-controller-pill` if anything changed.

---

## Validation per step

- Each step ends with: targeted vitest run (camera, slides, settings as relevant) + a one-screen manual check on `/slides/1`.
- Step 20 additionally runs the full suite and clears the gap-tasks file.
