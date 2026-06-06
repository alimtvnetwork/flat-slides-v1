# Plan — Fix preview-fullscreen + slide-4 step transition (RCA-first, 20 steps)

User asks (this turn):
1. Verify Present-from-preview-iframe breakage; verify "open in new tab → Present" works.
2. Fix slide 4 multi-step transition: black flash between steps; should be a smooth text crossfade only.
3. Write RCAs into a new `spec/issues/` folder, one MD per issue, with root cause + planned fix, BEFORE coding.
4. Then code and fix.

Hard constraints from project memory:
- Lists / steps / timeline MUST NOT scale or zoom — opacity + ≤16px translate only (default transition = `fade`, never `camera-zoom`).
- Step URL contract `/slides/N/S`, 1-based. Resolve via `slides[Number(slideId)-1]`.
- Any animated slide surface MUST consult `useReducedMotion()` from `@/components/slides/useReducedMotion`.

This turn is plan-only. No code edits.

---

## Pending items already tracked in `.lovable/pending-issues/index.md`

Appended here so they're resolved in order alongside the two new issues. Most are post-publish manual cross-browser checks; one is a CI Playwright run.

P1. Manual validation in published deployment of fullscreen Present across Chrome / Safari / Firefox popup blockers.
P2. Cross-browser popup-blocker validation on Chrome / Safari / Firefox after publish.
P3. Run Playwright e2e `e2e/fullscreen-present.spec.ts` in a CI image with Chromium system deps.
P4. Confirm "In-app hint when `embedded-popup-blocked`" actually mounts on both slide routes (`PresenterFallbackLink.tsx`) — marked shipped, re-verify.
P5. Manual validation of `/slides/print` PDF in Chrome / Safari / Firefox.
P6. Manual validation of `/slides/handout` PDF in Chrome / Safari / Firefox.
P7. Manual validation of `/slides/handout-3up` PDF in Chrome / Safari / Firefox.
P8. Manual cross-browser validation of controller hover-reveal + anchor cycling (post-publish).
P9. Manual cross-browser validation of inspector view (Chrome / Safari / Firefox, second-display) post-publish.

These get worked through in steps 17–20 (verification phase).

---

## 20 steps

### Phase A — RCA documents in `spec/issues/` (steps 1–4)

1. **Create `spec/issues/` folder + `README.md` index.** Lists every issue MD, status (open / in-progress / fixed), and links to spec file + test file.
2. **Write `spec/issues/001-preview-iframe-fullscreen.md`.** Sections: Symptom, Repro (Present button from in-app preview iframe vs. direct route), Root cause (read `src/components/slides/fullscreenTarget.ts`, `presenterWindowUrl.ts`, `PresenterFallbackLink.tsx`; identify whether iframe-detection branch fires, whether popup blocker hits, whether `?present=1` overlay shows), Fix plan, Regression test plan, Acceptance.
3. **Write `spec/issues/002-step-transition-black-flash.md`.** Sections: Symptom (slide 4, step→step shows black frame), Repro (`/slides/4/1` → `/slides/4/2`), Root cause hypothesis (`RenderSlide` likely remounts on step change instead of crossfading; `camera-zoom` or stage transition is leaking onto a `steps` slide; or the slide background paints through during opacity transition). Fix plan: opacity-only crossfade scoped to changed regions, no wrapper remount, no scale, respect `useReducedMotion`. Acceptance: no black frame, ≤200ms opacity transition, reduced-motion = instant swap.
4. **Confirm Core memory rules still hold** (`fade` default, lists/steps/timeline never zoom). Note in the RCAs any code that violates the rule — those become explicit fix items.

### Phase B — Investigation (steps 5–7)

5. **Trace fullscreen flow from preview iframe.** Read `fullscreenTarget.ts`, `presenterWindowUrl.ts`, `PresenterShell`, both slide routes' Present button. Confirm `window.self !== window.top` branch, popup path, `document.fullscreenEnabled` guard. Record findings in issue 001.
6. **Trace step-render pipeline.** Read `RenderSlide`, `CameraStage`, the `steps` slide component, the transition wrapper used by `/slides/$slideId.$step.tsx`. Identify the remount/zoom/black-bg cause. Record in issue 002.
7. **Reproduce both bugs in the running preview** via `browser--view_preview` at `/slides/4/1` then `/slides/4/2`, and the preview iframe Present click. Capture before-screenshots and attach paths to the RCAs.

### Phase C — Fix issue 002 (black step flash) (steps 8–11)

8. **Stabilize the step container.** Ensure the slide wrapper does NOT remount on step change — only inner step content swaps. Key the inner block by step index, not the whole slide.
9. **Replace any `scale` / `camera-zoom` transition on `steps`/`timeline`/lists** with opacity + ≤16px translate, per Core memory.
10. **Make the background layer persist across step swaps.** Render `ThemeWrap` / `resolveBackground()` once above the step crossfade so opacity transitions never reveal a black void.
11. **Add regression test** `src/components/slides/step-transition-no-black.test.tsx` asserting (a) wrapper element stable across step changes (same `data-testid` node), (b) no `transform: scale(...)` on the transition wrapper, (c) reduced-motion path is instant.

### Phase D — Fix issue 001 (preview iframe Present) (steps 12–15)

12. **Confirm iframe detection.** If `window.self !== window.top` and `document.fullscreenEnabled === false`, skip `requestFullscreen` entirely and go straight to the popup-window path.
13. **Make the popup fallback visible immediately when blocked**, with a copy-link affordance — re-verify `PresenterFallbackLink.tsx` is mounted on both slide routes; if not, mount it.
14. **In the new presenter window, ensure `?present=1` triggers the single-tap "Start presentation" gesture overlay**, then strips the param via `history.replaceState`.
15. **Add regression test** (or extend `fullscreenTarget.test.ts` / `presenterWindowUrl.test.ts`) for the iframe → popup branch.

### Phase E — Verify, sweep, close (steps 16–20)

16. **Run focused vitest suites** for steps + presenter + fullscreen + camera. All must be green.
17. **Walk pending items P1–P9** from the existing pending-issues list; for each, either resolve (mark `[x]`) or re-classify as "post-publish manual" and leave a single consolidated checklist entry.
18. **Update `spec/issues/README.md`** with each issue's final status and link to the regression test that locks it.
19. **Update `.lovable/pending-issues/index.md`** — tick issue 001 + 002 sections, append any newly-discovered follow-ups.
20. **Final preview pass at `/slides/4/1 → /4/2 → /4/3`** and Present from preview iframe; capture after-screenshots. If any acceptance line in issue 001 or 002 still fails, reopen the corresponding step and iterate. Otherwise close.

---

## Done definition

- `spec/issues/001-preview-iframe-fullscreen.md` and `spec/issues/002-step-transition-black-flash.md` exist with RCA + fix + acceptance.
- Slide 4 step→step shows no black frame; reduced-motion = instant.
- Present from preview iframe either enters fullscreen (when allowed) or opens the presenter window with a visible fallback link (never silent).
- Targeted vitest suites green; new regression tests added for both fixes.
- `.lovable/pending-issues/index.md` reflects new status.
