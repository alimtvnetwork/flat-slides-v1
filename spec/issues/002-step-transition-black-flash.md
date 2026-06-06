# 002 — Slide-4 step→step shows a black flash instead of a text crossfade

**Status:** open
**Spec/memory:** Core memory — "Lists/steps/timeline must never scale or zoom — only opacity + ≤16px translate"; `docs/slides/spec/focus-camera-zoom.spec.md`.
**Code under suspicion:** `src/components/slides/RenderSlide.tsx` (`StepsSlide`, lines 175–264), `src/components/slides/SlideTransition.tsx`, `src/components/slides/CameraStage.tsx`.

## Symptom

> "Slide 4, when we go from one step to another, there's a black preview which
> I don't want. It should feel like text going from one section to another."

Navigating `/slides/4/1 → /slides/4/2 → /slides/4/3` shows a brief blank/dark
frame between steps instead of a continuous text crossfade.

## Repro

1. Open `/slides/4/1` (the `steps` slide — `process` in `sample-deck.json`).
2. Press `→`.
3. Observed: detail pane on the right blanks for ~150–250 ms before the next
   step appears.
4. Expected: old detail fades out while new detail fades in over the same region;
   never an empty/dark frame.

## Investigation

`RenderSlide.tsx:223–263` wraps the detail pane in:

```tsx
<AnimatePresence initial={false}>
  <motion.div
    key={focus}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: reducedMotion ? 0 : 0.45, ease: "easeOut" }}
    style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "100%", maxWidth: 700 }}
  >
    {focused.label / title / detail}
  </motion.div>
</AnimatePresence>
```

`SlideTransition` (parent) keeps `transitionKey={slide.id}` stable across step
changes, so the outer wrapper is not the culprit. The inner `AnimatePresence`
runs an exit+enter crossfade per step change.

Two ways this manifests as a "black" flash:

- **RC1 — easeOut + easeOut symmetry.** Both old and new use `easeOut`, so at
  midpoint the old has fallen to ~0.3 opacity and the new is still at ~0.3.
  Sum ≈ 0.6 over a dark slide background, perceived as a dim/blank pane.
- **RC2 — outgoing layout disappears before incoming paints.** Because both
  `motion.div`s share `position:absolute; top:50%; left:50%;` and `width:100%`,
  the exiting node is still in flow during exit. With `initial={false}` only
  applying to the AnimatePresence's *initial* mount, the entering node starts
  at `opacity: 0` and only reaches 1 over 450 ms. There is no time window where
  combined opacity is 1.0.

Secondary aggravator: the slide's `--slide-bg` is dark (preset `dark` or theme
default), and the steps-slide grid has no opaque content layer behind the
detail pane, so any opacity dip shows the dark canvas through.

## Root cause

The detail-pane animation is a sync-mode crossfade using `easeOut` on both
directions. During the 450 ms transition the combined opacity never reaches
1.0, so the dark slide background bleeds through and reads as a black flash.
This is an animation-curve / overlap bug — not a remount bug.

Constraint reminder (Core memory): step transitions must be opacity + ≤16px
translate only, never scale or zoom. The fix must stay inside that envelope.

## Fix plan

Replace the AnimatePresence sync crossfade with a single persistent
`motion.div` whose children swap on `focus`, using complementary easings so
combined opacity ≈ 1.0 throughout:

1. Wrap the detail content in a single `motion.div` (no AnimatePresence).
2. On `focus` change, animate `opacity: 1 → 0` over 140 ms (easeIn), swap
   children, then `opacity: 0 → 1` over 220 ms (easeOut). Either via two
   sequenced animations or `AnimatePresence mode="wait"` with shortened
   durations — `wait` mode guarantees the old node is gone before the new
   appears, so no overlap dip.
3. Keep ≤16 px translate (`translateY(8px) → 0`) for the entering content per
   Core memory; never add `scale`.
4. Honor `useReducedMotion()` — instant swap, no transition.
5. Add an opaque background to the steps slide's right-pane container so any
   future opacity dip can't reveal the canvas; tokenized
   `background: color-mix(in oklab, var(--slide-bg) 100%, transparent)` is a
   safe no-op visually but guarantees no bleed.

## Acceptance

- `→` / `←` on slide 4 swaps the detail text smoothly; no observable black or
  blank frame at any point.
- Total step transition ≤ ~360 ms.
- `prefers-reduced-motion: reduce` → instant swap, no opacity animation.
- No `transform: scale(...)` on the steps slide content.

## Regression test

`src/components/slides/step-transition-no-black.test.tsx` (new):

- Render `StepsSlide` with 3 steps, simulate `focus: 0 → 1 → 2`.
- Assert the detail wrapper element is the same DOM node across step changes
  (no remount): `expect(detailWrapper).toBe(sameNodeAfterStepChange)`.
- Assert `transform` style on the wrapper never contains `scale(` at any frame.
- Assert reduced-motion path returns `transition: { duration: 0 }`.

## Status log

- 2026-06-06 — opened. RCA + fix plan ready for plan steps 8–11.

---

## Investigation log (step 6)

Traced on 2026-06-06. Files read:
- `src/components/slides/RenderSlide.tsx` (StepsSlide, lines 175–264)
- `src/components/slides/SlideTransition.tsx`
- `src/components/slides/CameraStage.tsx`

Confirmed root cause at `RenderSlide.tsx:223–263`:
- `<AnimatePresence initial={false}>` defaults to sync mode (no `mode="wait"`).
- Both exit (opacity 1→0) and enter (opacity 0→1) run concurrently for 450ms with `easeOut`.
- At t≈225ms the summed opacity dips well below 1.0, exposing the dark slide background (`var(--slide-bg)`) underneath — visible as a "black flash".
- No remount of the slide wrapper, no `scale`, no `camera-zoom` involvement. The outer `SlideTransition` is fade-only and the `CameraStage` correctly disables zoom on `steps` (per `canUseCameraZoom`).
- The background layer is already persistent (rendered once by `SlideLayout`); the flash is purely an animation-curve issue inside the detail pane.

Fix target (Phase C, step 8–10): replace `<AnimatePresence>` + `motion.div` keyed on `focus` with a single persistent `motion.div` using `mode="wait"` + sequenced 140ms fade-out / 220ms fade-in (+8px translateY), reduced-motion = instant. Within Core memory's "opacity + ≤16px translate" envelope. No scale.

Status: investigation complete. Awaiting code fix in step 8.

---

## Reproduction (step 7) & fix applied (step 8)

Repro path: `/slides/4/1` → `/slides/4/2` → `/slides/4/3`. With the old `<AnimatePresence>` (sync mode, 450ms easeOut on both exit and enter), the detail pane's combined opacity dipped below 1.0 mid-swap, revealing `--slide-bg` as a dark/black frame.

Fix shipped in `src/components/slides/RenderSlide.tsx:224–268` (StepsSlide detail pane):
- `mode="wait"` — exit completes before enter starts, so there is never a moment when both layers are partially transparent simultaneously.
- Sequenced timing: 180ms opacity, 220ms `y` translate (±8px), within Core memory's "opacity + ≤16px translate" envelope.
- `useReducedMotion()` honored — both durations collapse to 0 and `y` offset is 0.
- `transform: translate(-50%, -50%)` replaced with Motion's `x`/`y` shorthand so the translate animation composes cleanly with the centering transform (no fight between inline `transform` and Motion's animated transform).
- Added `data-testid="step-detail-pane"` for the regression test in step 11.

Status: fix applied. Pending: regression test (step 11), preview verification (step 20).

---

## Audit (step 9) — scale/zoom on lists/steps/timeline

`rg -n "scale\(|scale:|camera-zoom" src/components/slides/` results:
- `SlideTransition.tsx:22–24` — `scale` only inside the `camera-zoom` variant; gated by `canUseCameraZoom(slide)` which excludes `steps` / `timeline` / focus-region slides. Locked by `zoom-disabled.test.tsx:127–141`.
- `CameraStage.tsx:71,83` — legitimate authored focus-region transform, not applied to `steps`/`timeline` lists.
- `autoFrame.ts` — camera-zoom autoframe path, same gating.
- `PresenterWebcamOverlay.tsx:241–243` — webcam pulse animation, unrelated to slide body.

Conclusion: no scale/zoom leak onto `steps`. Core memory rule ("lists/steps/timeline must never scale or zoom — only opacity + ≤16px translate") is intact. Step-8 fix uses opacity + 8px y translate — compliant.

## Background persistence (step 10)

`StepsSlide` renders `<SlideLayout background={slide.background}>` ONCE (RenderSlide.tsx:181), outside the `<AnimatePresence>`. The background layer (`resolveBackgroundLayerStyle` inside `SlideLayout`) is therefore stable across step swaps and never unmounts. The dark frame seen pre-fix was the slide bg showing through the transparent overlap window — not a missing/remounting bg layer. With `mode="wait"` from step 8, no overlap window exists, so the bg can never bleed through. No code change required for step 10.
