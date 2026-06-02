# Slide Engine — Task Plan

Two-tier plan: **20 overview steps** (what), then **100 detailed steps**
(how). Implementation does NOT start until the user types `next`.

---

## Part 1 — 20 Overview Steps (what each task is)

1. Lock the spec in `/spec/README.md` and mirror sample images into `/assets/samples/`.
2. Define design tokens (colors, yellow highlight, fonts) in `src/styles.css`.
3. Wire fonts: Ubuntu (headings) + Poppins (body) via `@import` in `styles.css`.
4. Build the fixed 1920×1080 `ScaledSlide` wrapper component.
5. Build `SlideLayout` with header/footer reserves and chrome slots.
6. Create the slide registry + slide data model (id, type, props, notes).
7. Implement Type A — Left Slide component.
8. Implement Type B — Center Text Slide component (with highlight pill).
9. Implement Type C — Step-by-Step Slide component (step coordinate).
10. Implement Type D — Quote Slide component.
11. Build the URL router: `/slides/$slideId` and `/slides/$slideId/$step`.
12. Build keyboard navigation + control bar (prev / N/Total / next / share / export / settings).
13. Implement double-click slide-number jump input.
14. Implement Share button (clipboard + `navigator.share`).
15. Build the Settings drawer (background mode, color, image, darken, blur, transition, sound).
16. Implement the **Camera-Zoom** transition + whoosh SFX hook.
17. Implement Morph, Fade, and Eaten-Text transitions.
18. Implement Grid overview mode (`G`) and Fullscreen Present mode (`F5`).
19. Implement Export: PDF (`?print`), HTML bundle, GIF recorder.
20. QA pass: reduced-motion fallback, projector readability, share-link smoke test.

---

## Part 2 — 100 Detailed Steps

### A. Spec & Assets (1–8)
1. Save thumbnails to `/spec/` as `01-sample.webp`, `02-sample.webp`, `03-sample.jpg`.
2. Mirror the same three files to `/assets/samples/` (background sources).
3. Write `/spec/README.md` covering image descriptions, slide types, typography, highlight CSS, animations, backgrounds, export, navigation.
4. List open questions at the bottom of the spec (yellow hex, SFX source, GIF cap, Type E scope).
5. Reserve `/assets/audio/whoosh.mp3` slot; document it in spec until provided.
6. Add `.lovable/coding-guidelines.md` reference note (Boolean/Enum/error rules).
7. Capture sample-image color sampling (charcoal `#101010`, yellow `#FFD83A`, bone `#F4EFE4`) into tokens list.
8. Confirm with user before starting code (`next` gate).

### B. Tokens, Fonts, Theme (9–16)
9. Add `--slide-bg`, `--slide-fg`, `--slide-hl`, `--slide-hl-ink`, `--slide-muted` to `src/styles.css` (oklch).
10. Add light/dark variants for each slide token.
11. `@import` Ubuntu (400/500/700) and Poppins (400/600/700/900) from Google Fonts.
12. Define semantic slide classes: `.slide-title`, `.slide-subtitle`, `.slide-body`, `.slide-caption`, `.slide-kicker`, `.slide-chrome` per slides skill.
13. Add `.hl` (text-shadow) and `.hl-pill` (box-shadow) highlight classes per spec §4.
14. Add `@media (prefers-reduced-motion: reduce)` overrides for all animation classes.
15. Add `--slide-perspective: 2400px` and `--slide-camera-z` custom property for camera zoom.
16. Smoke-test tokens by rendering a static demo slide.

### C. Scaling & Layout primitives (17–24)
17. Create `src/components/slides/ScaledSlide.tsx` — fixed 1920×1080, centered, `transform: scale(min(sx, sy))`.
18. ResizeObserver-driven scale recompute.
19. Create `src/components/slides/SlideLayout.tsx` with header/footer reserve.
20. Add chrome slots: `topLeft`, `topRight`, `bottomLeft`, `bottomRight`.
21. Build `<Highlight>` component that renders `<mark class="hl">` or `.hl-pill` variant.
22. Build `<KeyboardScope>` hook for navigation keys.
23. Build `<TransitionStage>` wrapper (provides `perspective` + camera vars).
24. Add `useReducedMotion()` helper.

### D. Slide Data Model & Registry (25–32)
25. Define `Slide` TS type: `{ id, type: 'left'|'center'|'steps'|'quote'|'media', props, notes, transitionIn? }`.
26. Define `Deck` type: `{ id, title, slides: Slide[], settings: DeckSettings }`.
27. Define `DeckSettings`: `{ backgroundMode, backgroundColor, backgroundImage, darken, blur, transition, soundEnabled, volume }`.
28. Add an in-memory store (Zustand) for deck + settings.
29. Add deck serialization to localStorage (autosave).
30. Add deck import/export JSON helpers.
31. Seed an example deck reproducing the 3 sample thumbnails.
32. Unit-test deck reducers (add, delete, reorder, duplicate).

### E. Slide Type Components (33–48)
33. `LeftSlide.tsx` — two-column 45/55 split, media slot on right (img/video/none).
34. Support left padding, vertical centering, optional kicker above heading.
35. `CenterTextSlide.tsx` — centered headline + optional one-liner + inline highlight support.
36. Add pill highlight rendering when child is `<Highlight pill>`.
37. `StepsSlide.tsx` — accepts `steps: string[]` up to length 5.
38. Read `step` from URL; render steps `[0..step]` visible, `step+1..` hidden.
39. Animate the newly revealed step using the deck's transition setting.
40. `QuoteSlide.tsx` — large quote, attribution, optional avatar squircle.
41. (Reserved) `MediaFullSlide.tsx` — stub only.
42. Add per-slide `notes` rendered in Presenter view.
43. Add per-slide `background` override that wins over deck default.
44. Add per-slide `transitionIn` override.
45. Render a fake app-chrome decorator usable by any slide (matches `03-sample.jpg`).
46. Add a brand-bar component (RiseupAsia / RiseupPro lockups) usable as footer.
47. Add Storybook-style demo route `/slides/demo` rendering one of each type.
48. Snapshot-test each slide component at 1920×1080.

### F. Routing & Navigation (49–60)
49. Add route `src/routes/slides.tsx` (layout, renders Outlet).
50. Add route `src/routes/slides/$slideId.tsx` (single slide).
51. Add route `src/routes/slides/$slideId.$step.tsx` (Type C step).
52. Add route `src/routes/slides/index.tsx` (deck overview / grid).
53. Add route `src/routes/slides/print.tsx` (all slides stacked for PDF).
54. Wire `document.title` to `${index+1}/${total} — ${slide.title}`.
55. Implement keyboard scope on the slides layout (←, →, Space, Enter, G, F5, Esc).
56. Implement control bar component with: prev, N/Total, next, share, export, settings.
57. Implement double-click on `N` → editable input → Enter to jump, Esc to cancel.
58. Implement Share button: `navigator.share` if available, else clipboard + toast.
59. Implement Grid mode (`G`) using thumbnails of each slide.
60. Implement Fullscreen Present mode (`F5`) via Fullscreen API.

### G. Settings Drawer (61–68)
61. Build right-side `<SettingsDrawer>` triggered by gear icon in control bar.
62. Background mode toggle: `color | image`.
63. Color picker bound to `settings.backgroundColor`.
64. Image picker showing `/assets/samples/*` thumbnails + upload.
65. Sliders: darken (0–100%), blur (0–20px).
66. Transition selector: `camera-zoom | morph | fade | eaten`.
67. Sound toggle + volume slider for whoosh.
68. Persist settings to localStorage via the store.

### H. Animations (69–82)
69. Install `motion` (Framer Motion) if not already present.
70. Build `<CameraZoomTransition>` using a 3D perspective stage + Z translate + tiny rotateX easing.
71. Add a transient `filter: blur()` ramp on the incoming slide.
72. Add depth-of-field crossfade on the outgoing layer.
73. Trigger `assets/audio/whoosh.mp3` on transition start when `soundEnabled` and not reduced-motion.
74. Build `<MorphTransition>` using shared `layoutId` for matched elements.
75. Build `<FadeTransition>` (default) — 12px Y translate + opacity.
76. Build `<EatenTextTransition>` — per-character mask wipe + scale-down + blur, then incoming pop-in.
77. Wire per-step reveal animation for `StepsSlide` to the chosen transition.
78. Wire deck-level default transition to all slide-to-slide changes.
79. Add reduced-motion fallback (150ms fade + no audio).
80. Add a "Preview transition" button in Settings.
81. Throttle audio playback to avoid overlap on rapid arrow-key spam.
82. Smoke-test on 60Hz + 120Hz displays.

### I. Export Pipeline (83–92)
83. Build `?print` route layout: all slides stacked vertically at 1920×1080.
84. Add `@page { size: 1920px 1080px landscape; margin: 0 }` print CSS.
85. Add a "Print to PDF" instruction toast on the print route.
86. Build HTML export: bundle current deck + assets into a single `deck.html` (Blob download).
87. Inline minimal CSS for HTML export so it works offline.
88. Build GIF export: walk the deck programmatically, capture frames via `html-to-image`, encode with `gif.js`.
89. Add resolution selector for GIF (720p / 1080p).
90. Add progress bar for GIF export.
91. Add "Export current slide only" toggle.
92. Show toast with download link on completion.

### J. QA, Accessibility, Polish (93–100)
93. Verify projector readability: body ≥ 28px, chrome ≥ 18px.
94. Verify reduced-motion path on every transition.
95. Verify keyboard-only navigation completes a full deck walkthrough.
96. Verify share link cold-loads to the exact slide + step.
97. Verify double-click slide-number jump out-of-range (clamp + toast).
98. Cross-browser smoke: Chrome, Safari, Firefox.
99. Lighthouse pass on `/slides` (perf + a11y).
100. Final spec/README sync; mark v1 complete.
