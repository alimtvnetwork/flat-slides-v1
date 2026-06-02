# Slide Engine — Detailed Implementation Spec

This is the blind-implementation contract. Every step lists: **Goal**, **Files**, **Exact contract**, **Acceptance**. An AI must be able to implement each step without inferring missing detail.

Coordinate system: every slide authored at **1920×1080**, scaled to viewport via `transform: scale(min(sx, sy))`. All px values below are slide-space px unless noted.

Stack: TanStack Start v1 (file routes under `src/routes/`), React 19, Tailwind v4 (tokens in `src/styles.css`), Zustand for store, `motion` (Framer Motion) for transitions, `sonner` for toasts.

---

## Steps 1–10 — Spec, Assets, Tokens, Fonts, Theme

### Step 1 — Lock thumbnail samples in `/spec/`
- **Goal:** Make the three reference images the immutable visual contract.
- **Files:** `spec/01-sample.webp`, `spec/02-sample.webp`, `spec/03-sample.jpg` (already present).
- **Contract:**
  - Filenames are stable; do not rename.
  - `01-sample.webp` = Type A (Left Slide). Charcoal bg, large heading on left, decorative media on right.
  - `02-sample.webp` = Type B (Center Text Slide) with **yellow pill highlight** behind a hero phrase.
  - `03-sample.jpg` = Type C (Step-by-step) inside fake "app chrome" frame; bone background, multiple numbered steps stacked.
- **Acceptance:** `ls spec/` shows all three files; `spec/README.md` references each by filename.

### Step 2 — Mirror sources into `/assets/samples/`
- **Goal:** Allow the running app to import the same images as selectable backgrounds.
- **Files:** `assets/samples/01-sample.webp`, `assets/samples/02-sample.webp`, `assets/samples/03-sample.jpg`.
- **Contract:** Byte-identical to `/spec/` copies. They are used by `SettingsDrawer` image picker.
- **Acceptance:** `cmp spec/01-sample.webp assets/samples/01-sample.webp` exits 0 for all three.

### Step 3 — Author `spec/README.md`
- **Goal:** Human-readable overview that links to this SPEC.md.
- **Files:** `spec/README.md`.
- **Contract:** Sections: (1) Image descriptions, (2) Slide types A–D, (3) Typography, (4) Highlight CSS, (5) Animations summary, (6) Backgrounds, (7) Export, (8) Navigation, (9) Open questions.
- **Acceptance:** All 9 sections present; first line links to `SPEC.md`.

### Step 4 — Open questions log
- **Goal:** Capture undecided values so implementation steps stay deterministic.
- **Files:** Append to `spec/README.md` § "Open Questions".
- **Contract — defaults assumed until user overrides:**
  - Yellow hex → `#FFD83A` (`oklch(0.882 0.176 95.4)`).
  - Whoosh SFX → synthesized via Web Audio (already implemented). External `whoosh.mp3` optional override at `assets/audio/whoosh.mp3`.
  - GIF cap → 12 fps, max 1080p, max 60 s.
  - Type E (`MediaFullSlide`) → stub-only in v1.
- **Acceptance:** Each item appears with both the question and the chosen default.

### Step 5 — Reserve audio asset slot
- **Goal:** Allow drop-in replacement of the synthesized whoosh.
- **Files:** Create `assets/audio/.gitkeep`; document expected `assets/audio/whoosh.mp3` in spec.
- **Contract:** `audio.ts` MUST attempt `new Audio('/assets/audio/whoosh.mp3')`; on `error`/missing-file, fall back to synthesized whoosh. No console error in fallback path.
- **Acceptance:** With file absent, navigation still plays a whoosh; with file present, the MP3 plays instead.

### Step 6 — Coding-guidelines reference
- **Goal:** Force consistent error handling and enum usage across slide engine code.
- **Files:** `.lovable/coding-guidelines.md`.
- **Contract:**
  - All slide types declared as TS string-literal unions (no enums).
  - All boolean props prefixed `is`/`has`/`can`.
  - Catch blocks must call `toast.error(...)` from `sonner` — never silently swallow.
  - No `any`. Use `unknown` + narrowing.
- **Acceptance:** File exists and is referenced from `spec/README.md`.

### Step 7 — Sampled color tokens
- **Goal:** Lock palette derived from the sample images.
- **Files:** Add to `spec/README.md` § Tokens + implement in `src/styles.css` (Step 9).
- **Contract — exact values:**
  - `--slide-bg`       = `oklch(0.18 0 0)`        (charcoal `#101010`)
  - `--slide-fg`       = `oklch(0.96 0.012 85)`   (bone `#F4EFE4`)
  - `--slide-muted`    = `oklch(0.66 0.012 85)`   (warm gray)
  - `--slide-hl`       = `oklch(0.882 0.176 95.4)` (yellow `#FFD83A`)
  - `--slide-hl-ink`   = `oklch(0.18 0 0)`        (ink on yellow)
  - `--slide-accent`   = `oklch(0.72 0.18 38)`    (warm orange, reserved)
- **Acceptance:** All six tokens present in `src/styles.css :root` and listed in spec.

### Step 8 — `next` gate
- **Goal:** No code changes until user confirms.
- **Contract:** Implementation only proceeds when user types `next`. Each `next N` advances N detailed steps.
- **Acceptance:** This SPEC.md exists; no source files modified by spec-writing steps 1–8.

### Step 9 — Define slide tokens in `src/styles.css`
- **Goal:** Make tokens available to Tailwind v4 via `@theme inline`.
- **Files:** `src/styles.css`.
- **Contract:**
  ```css
  :root {
    --slide-bg:      oklch(0.18 0 0);
    --slide-fg:      oklch(0.96 0.012 85);
    --slide-muted:   oklch(0.66 0.012 85);
    --slide-hl:      oklch(0.882 0.176 95.4);
    --slide-hl-ink:  oklch(0.18 0 0);
    --slide-accent:  oklch(0.72 0.18 38);
    --slide-perspective: 2400px;
  }
  @theme inline {
    --color-slide-bg: var(--slide-bg);
    --color-slide-fg: var(--slide-fg);
    --color-slide-muted: var(--slide-muted);
    --color-slide-hl: var(--slide-hl);
    --color-slide-hl-ink: var(--slide-hl-ink);
    --color-slide-accent: var(--slide-accent);
  }
  ```
- **Acceptance:** `bg-slide-bg text-slide-fg` Tailwind classes compile.

### Step 10 — Light/dark slide variants
- **Goal:** Slides stay readable in printed/light export contexts (`?print` on white paper).
- **Files:** `src/styles.css`.
- **Contract:**
  ```css
  .slide-theme-light {
    --slide-bg:    oklch(0.97 0.005 85);
    --slide-fg:    oklch(0.20 0 0);
    --slide-muted: oklch(0.45 0 0);
  }
  .slide-theme-dark { /* defaults already dark */ }
  @media print {
    .slide-content { --slide-bg: white; --slide-fg: black; }
  }
  ```
  - `SlideLayout` reads `deck.settings.theme: 'light' | 'dark'` and applies the corresponding class to its outer wrapper.
- **Acceptance:** Toggling theme in Settings flips bg/fg without reload.

---

## Remaining 11–100 — title list (full detail expands on each `next N`)

### B. Fonts & Typography (11–16)
11. `@import` Ubuntu (400/500/700) + Poppins (400/600/700/900) at top of `src/styles.css`.
12. Define `.slide-title`, `.slide-subtitle`, `.slide-body`, `.slide-caption`, `.slide-kicker`, `.slide-chrome` (sizes per slides skill).
13. Implement `.hl` (text-shadow underline) + `.hl-pill` (box-shadow pill) highlight classes.
14. Add `@media (prefers-reduced-motion: reduce)` overrides for all `.slide-*-anim` classes.
15. Add `--slide-camera-z` custom property + 3D perspective stage CSS.
16. Render `/slides/_demo` smoke-test slide rendering every typography + highlight token.

### C. Scaling & Layout primitives (17–24)
17. `src/components/slides/ScaledSlide.tsx` — 1920×1080 centered, `transform: scale(min(sx, sy))`.
18. ResizeObserver-driven scale recompute (debounced 16 ms).
19. `src/components/slides/SlideLayout.tsx` — header/footer reserves (120 / 90 px).
20. Chrome slots: `topLeft / topRight / bottomLeft / bottomRight` named props.
21. `<Highlight pill?>` component → renders `<mark class="hl">` or `.hl-pill`.
22. `useSlideKeyboard()` hook — registers ←/→/Space/Enter/G/F5/Esc with scope guard.
23. `<TransitionStage>` wrapper providing `perspective` + camera vars to children.
24. `useReducedMotion()` helper (reads `matchMedia('(prefers-reduced-motion: reduce)')`).

### D. Slide Data Model & Registry (25–32)
25. `Slide` TS type: `{ id; type: 'left'|'center'|'steps'|'quote'|'media'; props; notes?; transitionIn? }`.
26. `Deck` TS type: `{ id; title; slides: Slide[]; settings: DeckSettings }`.
27. `DeckSettings`: `{ theme; backgroundMode; backgroundColor; backgroundImage?; darken; blur; transition; isSoundEnabled; volume }`.
28. Zustand store `useDeck` with selectors + actions.
29. localStorage autosave (debounced 500 ms) keyed by `deck.id`.
30. JSON import/export helpers (`exportDeck()`, `importDeck(json)`).
31. Seed example deck reproducing the three sample thumbnails.
32. Vitest tests for `add/delete/reorder/duplicate` reducers.

### E. Slide Type Components (33–48)
33. `LeftSlide.tsx` — 45/55 split, media slot right.
34. Vertical centering, optional kicker above heading, configurable left padding.
35. `CenterTextSlide.tsx` — centered headline + optional subtitle + inline Highlight.
36. Auto-detect `<Highlight pill>` children and render pill variant.
37. `StepsSlide.tsx` — accepts `steps: string[]` (max 5).
38. Read `step` URL param; render steps `[0..step]` visible.
39. Animate newly revealed step per deck transition setting.
40. `QuoteSlide.tsx` — large quote glyph, attribution, optional avatar squircle.
41. `MediaFullSlide.tsx` — stub component returning `null` with TODO comment.
42. Per-slide `notes` rendered in Presenter view bottom panel.
43. Per-slide `background` override beats deck default.
44. Per-slide `transitionIn` override beats deck default.
45. `AppChromeDecorator` matching `03-sample.jpg` (window controls + URL bar).
46. `BrandBar` component (RiseupAsia / RiseupPro lockups) usable in any footer slot.
47. `/slides/demo` route rendering one of each slide type.
48. Vitest snapshot tests at 1920×1080 for every slide component.

### F. Routing & Navigation (49–60)
49. `src/routes/slides.tsx` — layout `<Outlet/>` + KeyboardScope.
50. `src/routes/slides.$slideId.tsx` — single slide.
51. `src/routes/slides.$slideId.$step.tsx` — Type C step coordinate.
52. `src/routes/slides.index.tsx` — grid overview.
53. `src/routes/slides.print.tsx` — all slides stacked for PDF.
54. Sync `document.title` to `${i+1}/${total} — ${slide.title}` on change.
55. Keyboard scope on slides layout (←, →, Space, Enter, G, F5, Esc).
56. `<ControlBar>` — prev / `N/Total` / next / share / export / settings.
57. Double-click `N` → editable input → Enter jumps (clamped), Esc cancels.
58. Share button — `navigator.share` when available, clipboard + toast fallback.
59. Grid mode (`G`) using slide thumbnails.
60. Fullscreen Present mode (`F5`) via Fullscreen API + cursor-hide after 2 s.

### G. Settings Drawer (61–68)
61. Right-side `<SettingsDrawer>` triggered by gear icon.
62. Background mode toggle: `color | image`.
63. Color picker bound to `settings.backgroundColor`.
64. Image picker showing `/assets/samples/*` thumbnails + upload (data-URL).
65. Sliders — darken (0–100%), blur (0–20 px).
66. Transition selector — `camera-zoom | morph | fade | eaten`.
67. Sound toggle + volume slider (0–100).
68. Persist settings to localStorage via store autosave.

### H. Animations (69–82)
69. Install `motion`; lock to ^11.
70. `<CameraZoomTransition>` — 3D perspective + `translateZ` + tiny rotateX.
71. Transient `filter: blur(...)` ramp on incoming slide.
72. Depth-of-field crossfade on outgoing layer.
73. Trigger whoosh on transition start when sound on + not reduced-motion.
74. `<MorphTransition>` — `layoutId` matched elements.
75. `<FadeTransition>` — 12 px Y translate + opacity.
76. `<EatenTextTransition>` — per-character mask wipe + scale + blur.
77. Wire StepsSlide step reveal to chosen transition.
78. Deck-level default transition applied to slide-to-slide changes.
79. Reduced-motion fallback (150 ms fade, no audio).
80. "Preview transition" button in Settings.
81. Throttle audio (120 ms) to prevent overlap on key spam.
82. Smoke-test on 60 Hz + 120 Hz.

### I. Export Pipeline (83–92)
83. `?print` layout — all slides stacked vertically 1920×1080.
84. `@page { size: 1920px 1080px landscape; margin: 0 }`.
85. "Print to PDF" instructional toast on print route.
86. HTML export — bundle deck + assets into single `deck.html` Blob.
87. Inline minimal CSS for offline HTML export.
88. GIF export via `html-to-image` + `gif.js`.
89. GIF resolution selector (720p / 1080p).
90. GIF export progress bar.
91. "Export current slide only" toggle.
92. Completion toast with download link.

### J. QA, Accessibility, Polish (93–100)
93. Verify projector readability — body ≥ 28 px, chrome ≥ 18 px.
94. Verify reduced-motion path on every transition.
95. Keyboard-only full-deck walkthrough.
96. Share link cold-loads to exact slide + step.
97. Out-of-range slide-jump clamps + toasts.
98. Cross-browser smoke — Chrome, Safari, Firefox.
99. Lighthouse pass on `/slides` (perf + a11y).
100. Final spec/README sync; tag v1.
