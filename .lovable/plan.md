# Plan — Repair Present fullscreen, slide-4 steps animation, white text, and highlight shadow

This is a **plan-only spec** for the next implementation pass. No product code is changed in this step.

## Inputs checked

- `.lovable/coding-guidelines.md` exists and applies.
- `spec/coding-guidelines/` is absent.
- `.lovable/seo-guidelines.md` is absent.
- `.lovable/strictly-avoid.md` and memory files confirm: no default camera zoom, no glow/blur on `.hl`, yellow highlight uses exactly `text-shadow: rgb(0 0 0) 1px 0.7px 0px;`.
- `.lovable/pending-issues/index.md` still has post-publish/manual pending checks; these remain pending unless they can be validated in the current dev sandbox.

## 10 implementation steps

1. **Reproduce and capture the two live failures first.** Use the preview at `/slides/4/1 → /slides/4/2 → /slides/4/3` and Present mode from the embedded preview window; record whether the blackout happens specifically on step 2→3 and whether Present exits fullscreen on slide advance.

2. **Trace the fullscreen-present state machine.** Inspect the Present button, `useFullscreen`, `fullscreenTarget`, presenter routes, keyboard navigation, and any slide-advance side effects; identify why advancing slides leaves fullscreen/present mode instead of preserving the presentation container.

3. **Fix fullscreen persistence across navigation.** Keep Present mode state stable while moving next/previous, avoid remounting the fullscreen shell on slide URL changes, and ensure embedded-preview fallback still opens or links the presenter window rather than silently failing.

4. **Trace slide-4 step animation with real step data.** Inspect the `steps` slide rendering path, the active/future/completed step styling, `AnimatePresence` usage, background layer, and slide/step keys; identify why step 2→3 still reveals a black frame.

5. **Replace the step transition with a no-black-frame swap.** Use one persistent detail-pane/background container and an opacity-only/≤16px translate transition that respects `useReducedMotion()`; do not use `scale`, camera zoom, glow, or blur on the active text.

6. **Set step-state visual hierarchy.** Make the current step highest opacity, completed steps lower opacity, and future steps slightly blurred and lower emphasis; keep this styling scoped to step list affordances so it does not blur the main active content.

7. **Make default slide text white.** Update the default theme/text pipeline so core principle text and default slide foreground render true white, not gray; audit muted text usage so only intentionally secondary labels use muted gray.

8. **Enforce the yellow highlight/shadow rule.** Remove any glow/blur/drop-shadow treatment from yellow highlights or yellow-bordered emphasis elements, and apply exactly `text-shadow: rgb(0 0 0) 1px 0.7px 0px;` where yellow text/highlight styling requires ink separation.

9. **Add regression coverage before closing.** Extend or add focused tests for: fullscreen stays active across next-slide navigation, embedded-preview Present fallback remains available, slide-4 step 2→3 has no black-frame/remount, step-state opacity/blur classes are applied correctly, default foreground is white, and `.hl` has no glow.

10. **Validate and update task tracking.** Run the focused Vitest suites and preview checks; update `spec/issues/001-preview-iframe-fullscreen.md`, `spec/issues/002-step-transition-black-flash.md`, `spec/issues/README.md`, and `.lovable/pending-issues/index.md`, marking only actually validated items done and leaving post-publish browser checks pending.

## Acceptance criteria

- Present mode does not break out of fullscreen/presenter state when advancing slides.
- Slide 4 step 2→3 does not black out; transitions are smooth and motion-reduced users get instant swaps.
- Default principle/body text is true white unless explicitly marked secondary.
- Future steps are slightly blurred/lower emphasis; completed steps have lower opacity; active step is clearest/highest opacity.
- Yellow highlight styling has no glow/blur and uses the exact requested text shadow.
- Pending issues are not falsely closed; only verified fixes are marked done.
