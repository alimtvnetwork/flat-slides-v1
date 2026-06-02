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

## Steps 11–20 — Fonts, Typography, Highlight CSS, Motion, Scaling

### Step 11 — Web fonts via `@import`
- **Goal:** Headings in **Ubuntu**, body in **Poppins**. Loaded once, available app-wide.
- **Files:** `src/styles.css` (very first lines, before `@import "tailwindcss"`).
- **Contract:**
  ```css
  @import url('https://fonts.googleapis.com/css2?family=Ubuntu:wght@400;500;700&family=Poppins:wght@400;600;700;900&display=swap');
  ```
  - Then add to `@theme inline`:
    ```css
    --font-display: 'Ubuntu', system-ui, sans-serif;
    --font-body:    'Poppins', system-ui, sans-serif;
    ```
  - `.slide-content { font-family: var(--font-body); }`
  - `.slide-title, .slide-subtitle, .slide-kicker { font-family: var(--font-display); font-weight: 700; }`
- **Acceptance:** DevTools → Network shows both font families loaded; titles render in Ubuntu, body in Poppins. No FOUT longer than 200 ms with `display=swap`.

### Step 12 — Semantic typography classes
- **Goal:** Lock projector-readable sizes into named classes; never use raw `text-*` Tailwind for slide body.
- **Files:** `src/styles.css`.
- **Contract — exact values (slide-space px):**
  ```css
  .slide-content {
    width: 1920px; height: 1080px; overflow: hidden; position: relative;
    color: var(--slide-fg); background: var(--slide-bg);
    --slide-title-lg: 104px; --slide-title: 88px; --slide-subtitle: 52px;
    --slide-body-lg: 40px;   --slide-body: 32px;  --slide-caption: 24px;
    --slide-kicker: 22px;    --slide-chrome: 20px;
  }
  .slide-title-lg { font-size: var(--slide-title-lg); line-height: 1.0;  letter-spacing: -0.05em; }
  .slide-title    { font-size: var(--slide-title);    line-height: 1.05; letter-spacing: -0.04em; }
  .slide-subtitle { font-size: var(--slide-subtitle); line-height: 1.15; letter-spacing: -0.025em; }
  .slide-body-lg  { font-size: var(--slide-body-lg);  line-height: 1.22; }
  .slide-body     { font-size: var(--slide-body);     line-height: 1.28; }
  .slide-caption  { font-size: var(--slide-caption);  line-height: 1.25; }
  .slide-kicker   { font-size: var(--slide-kicker);   line-height: 1.1;  letter-spacing: 0.12em; text-transform: uppercase; }
  .slide-chrome, .slide-badge, .slide-footer, .slide-page {
    font-size: var(--slide-chrome); line-height: 1.15;
  }
  .slide-badge, .slide-page { white-space: nowrap; }
  ```
- **Reasoning:** Slide renders at 1920×1080 then scales — Tailwind's 16px body would project at 4–8 css px. Semantic classes guarantee readability regardless of scale.
- **Acceptance:** Rendering `<p class="slide-body">…</p>` inside a `.slide-content` shows 32 px slide-space. Tailwind `text-lg` still works for non-slide app chrome (toolbar).

### Step 13 — Yellow highlight: `.hl` and `.hl-pill`
- **Goal:** Replicate the `02-sample.webp` hero highlight in two flavors: underline-glow (inline) and solid pill (block phrase).
- **Files:** `src/styles.css`.
- **Contract:**
  ```css
  .hl {
    background-image: linear-gradient(transparent 62%, var(--slide-hl) 62%, var(--slide-hl) 92%, transparent 92%);
    color: inherit;
    padding: 0 0.08em;
  }
  .hl-pill {
    display: inline-block;
    background: var(--slide-hl);
    color: var(--slide-hl-ink);
    padding: 0.08em 0.32em;
    border-radius: 0.18em;
    box-shadow: 0 0 0 0.04em var(--slide-hl) inset, 0 8px 0 -2px color-mix(in oklab, var(--slide-hl) 60%, black 0%);
    line-height: 1.05;
  }
  ```
- **Component contract:** `<Highlight pill>text</Highlight>` → `.hl-pill`; `<Highlight>text</Highlight>` → `.hl`.
- **Acceptance:** Visual diff against `02-sample.webp` shows yellow phrase rendered with same baseline and ink color.

### Step 14 — Reduced-motion overrides
- **Goal:** Respect `prefers-reduced-motion: reduce` — no camera-zoom, no whoosh, no shake.
- **Files:** `src/styles.css`.
- **Contract:**
  ```css
  @media (prefers-reduced-motion: reduce) {
    .slide-anim-camera, .slide-anim-morph, .slide-anim-eaten {
      animation: none !important;
      transition: opacity 150ms linear !important;
      transform: none !important;
      filter: none !important;
    }
  }
  ```
  - JS side: `useReducedMotion()` short-circuits `playWhoosh()` and forces transition to `'fade'` with 150 ms duration.
- **Acceptance:** Toggling OS reduce-motion → slide changes become a 150 ms fade with no audio.

### Step 15 — Perspective + camera-z custom properties
- **Goal:** Allow the camera-zoom transition to be tuned by CSS variables (no JS recompile).
- **Files:** `src/styles.css`.
- **Contract:**
  ```css
  :root {
    --slide-perspective: 2400px;
    --slide-camera-z:    -600px;   /* incoming start Z */
    --slide-camera-blur: 14px;     /* incoming start blur */
    --slide-camera-dur:  720ms;    /* transition duration */
  }
  .slide-stage {
    perspective: var(--slide-perspective);
    transform-style: preserve-3d;
    perspective-origin: 50% 50%;
  }
  ```
- **Acceptance:** Changing `--slide-camera-z` in DevTools alters depth of incoming slide live.

### Step 16 — Typography smoke-test route `/slides/_demo`
- **Goal:** One page exercising every semantic class + highlight variant for visual review.
- **Files:** `src/routes/slides._demo.tsx`.
- **Contract:** Renders a `ScaledSlide` containing — top-to-bottom — kicker, title-lg, title, subtitle, body-lg, body paragraph (2 lines), caption, chrome row with pill, inline `.hl` example, block `.hl-pill` example.
- **Acceptance:** Visiting `/slides/_demo` shows each class at correct size; manual measurement of `.slide-title` ≈ 88 px in slide space (use a 1×1 scale by opening at 1920×1080 viewport).

### Step 17 — `ScaledSlide` component
- **Goal:** Single component that fits a 1920×1080 slide inside any parent.
- **Files:** `src/components/slides/ScaledSlide.tsx`.
- **Contract:**
  ```tsx
  type Props = { children: ReactNode; className?: string };
  // Outer: position: relative; overflow: hidden; width/height: 100%.
  // Inner wrapper: position: absolute; width: 1920px; height: 1080px;
  //                left: 50%; top: 50%; margin-left: -960px; margin-top: -540px;
  //                transform: scale(var(--scale)); transform-origin: center center;
  // Compute scale = Math.min(parentW / 1920, parentH / 1080).
  ```
  - Uses `useLayoutEffect` + ResizeObserver. Writes `--scale` to outer `style`.
  - Default min scale 0.05 to avoid `scale(0)` on hidden parents.
- **Acceptance:** Resizing window keeps slide centered, never clips, maintains 16:9.

### Step 18 — ResizeObserver-driven recompute (debounced 16 ms)
- **Goal:** Smooth scale during window/sidebar drag without thrash.
- **Files:** `src/components/slides/ScaledSlide.tsx` (same file as Step 17).
- **Contract:**
  - Single `ResizeObserver` on the outer container.
  - `requestAnimationFrame` coalesces multiple entries inside the same frame.
  - Cleanup on unmount: `observer.disconnect()`.
  - No reliance on `window.resize` — covers sidebar drags too.
- **Acceptance:** Dragging the sidebar in editor view re-scales at 60 fps (no jank); console shows ≤ 1 scale write per frame.

### Step 19 — `SlideLayout` with header/footer reserves
- **Goal:** Standard reserved zones so all slides feel laid out on a shared grid.
- **Files:** `src/components/slides/SlideLayout.tsx`.
- **Contract:**
  ```tsx
  type Reserve = { top?: number; bottom?: number; left?: number; right?: number };
  type Props = {
    children: ReactNode;
    reserve?: Reserve;                  // defaults: top 120, bottom 90, left 96, right 96
    theme?: 'light' | 'dark';            // applies .slide-theme-* class
    background?: { mode: 'color'|'image'; color?: string; image?: string; darken?: number; blur?: number };
    topLeft?: ReactNode; topRight?: ReactNode;
    bottomLeft?: ReactNode; bottomRight?: ReactNode;
  };
  ```
  - Layout: outer `.slide-content` → background layer (absolute, full-bleed, with `filter: blur()` and dim overlay) → header row (height = reserve.top) → main content (flex-1) → footer row (height = reserve.bottom).
  - Padding inset uses reserve.left / reserve.right.
- **Acceptance:** A slide using default reserve has main content area exactly 1920 × (1080-120-90) = 1920 × 870 px; chrome slots render in corners.

### Step 20 — Chrome slots (`topLeft / topRight / bottomLeft / bottomRight`)
- **Goal:** Standard placement for brand bar, page counter, pills, decorative chips.
- **Files:** `src/components/slides/SlideLayout.tsx` (same file as Step 19).
- **Contract:**
  - Each slot is `position: absolute` within the header/footer row.
  - Padding from edges: 48 px horizontal, 24 px vertical (slide-space).
  - Slots receive `.slide-chrome` class by default; consumers can wrap with `.slide-badge` / `.slide-page`.
  - Vertical alignment: `topLeft/topRight` align-items: center within header; `bottomLeft/bottomRight` align-items: center within footer.
  - Z-index: slots > background layer, < `<Outlet/>` modals.
- **Acceptance:** Providing `topRight={<span className="slide-page">3 / 12</span>}` renders the counter 48 px from right edge, vertically centered in the 120 px header.

## Steps 21–30 — Highlight, Keyboard, Stage, Reduced-motion, Data Model

### Step 21 — `<Highlight>` component
- **Goal:** Single component that renders inline glow (`.hl`) or block pill (`.hl-pill`) matching `02-sample.webp`.
- **Files:** `src/components/slides/Highlight.tsx`.
- **Contract:**
  ```tsx
  type HighlightProps = {
    children: ReactNode;
    pill?: boolean;        // false → .hl; true → .hl-pill
    as?: 'mark' | 'span';  // default 'mark' for inline, 'span' for pill
    className?: string;
  };
  export function Highlight({ children, pill = false, as, className }: HighlightProps) {
    const Tag = (as ?? (pill ? 'span' : 'mark')) as any;
    return <Tag className={cn(pill ? 'hl-pill' : 'hl', className)}>{children}</Tag>;
  }
  ```
  - MUST forward className (lets slides add `whitespace-nowrap` or extra padding).
  - Inline `.hl` keeps inherited color; `.hl-pill` overrides to `--slide-hl-ink`.
- **Acceptance:** `<Highlight>fast</Highlight>` renders `<mark class="hl">fast</mark>`; `<Highlight pill>Riseup Pro</Highlight>` renders the yellow pill with dark ink.

### Step 22 — `useSlideKeyboard()` hook
- **Goal:** Centralize keyboard handling so every slide route gets identical bindings without duplicating effects.
- **Files:** `src/components/slides/useSlideKeyboard.ts`.
- **Contract:**
  ```ts
  type Handlers = {
    onPrev?: () => void;       // ArrowLeft, PageUp
    onNext?: () => void;       // ArrowRight, ArrowDown, PageDown, Space, Enter
    onGrid?: () => void;       // 'g' or 'G'
    onPresent?: () => void;    // F5
    onEscape?: () => void;     // Escape
    onJump?: (n: number) => void; // 0-9 digits (build buffer over 500 ms then jump)
  };
  export function useSlideKeyboard(h: Handlers, opts?: { enabled?: boolean }): void;
  ```
  - Scope guard: ignore when `e.target` is `INPUT`, `TEXTAREA`, or `[contenteditable]`.
  - Ignore when any modifier (ctrl/meta/alt) is held EXCEPT Shift+Space → onPrev.
  - Digit buffer cleared on non-digit key or 500 ms inactivity.
  - Single `keydown` listener on `window`; cleanup on unmount.
- **Acceptance:** Pressing `→` calls `onNext` once; typing in `<input>` does NOT trigger handlers; pressing `12 Enter` calls `onJump(12)`.

### Step 23 — `<TransitionStage>` wrapper
- **Goal:** Provide the 3D perspective context that camera-zoom and morph transitions need, exposed as CSS vars overridable per deck.
- **Files:** `src/components/slides/TransitionStage.tsx`.
- **Contract:**
  ```tsx
  type StageProps = {
    children: ReactNode;
    perspective?: number;   // default reads var(--slide-perspective)
    cameraZ?: number;       // default reads var(--slide-camera-z)
    cameraBlur?: number;    // default reads var(--slide-camera-blur)
    durationMs?: number;    // default 720
    className?: string;
  };
  ```
  - Renders a `div.slide-stage` with inline style overrides only for props that are provided.
  - Sets `transform-style: preserve-3d`, `perspective-origin: 50% 50%`, `overflow: hidden`.
  - MUST be the immediate parent of `<AnimatePresence>` so child transforms compose correctly.
- **Acceptance:** Camera-zoom transition reads stage vars; changing `perspective` prop visibly changes parallax depth without code change.

### Step 24 — `useReducedMotion()` helper
- **Goal:** Single source of truth for motion preference, reactive to OS-level changes.
- **Files:** `src/components/slides/useReducedMotion.ts`.
- **Contract:**
  ```ts
  export function useReducedMotion(): boolean;
  ```
  - On mount: `const mql = window.matchMedia('(prefers-reduced-motion: reduce)')`.
  - Subscribe via `mql.addEventListener('change', …)`; cleanup on unmount.
  - SSR-safe: returns `false` when `window` undefined.
  - Consumers: `SlideTransition` (forces fade, 150 ms), `audio.ts` (skips whoosh), `StepsSlide` (instant reveal).
- **Acceptance:** Toggling OS reduce-motion while preview is open updates returned boolean within one frame.

### Step 25 — `Slide` TS type + `SlideType` union
- **Goal:** Discriminated union so each slide's `props` is type-checked against its `type`.
- **Files:** `src/components/slides/types.ts`.
- **Contract:**
  ```ts
  export type SlideType = 'left' | 'center' | 'steps' | 'quote' | 'media';
  export type TransitionName = 'camera-zoom' | 'morph' | 'fade' | 'eaten';

  export type LeftProps   = { kicker?: string; title: string; subtitle?: string; media?: MediaRef };
  export type CenterProps = { title: string; subtitle?: string; highlight?: { text: string; pill?: boolean } };
  export type StepsProps  = { title?: string; steps: string[] /* max 5 */ };
  export type QuoteProps  = { quote: string; author: string; role?: string; avatar?: string };
  export type MediaProps  = { src: string; kind: 'image' | 'video'; caption?: string };

  export type Slide =
    | { id: string; type: 'left';   props: LeftProps;   notes?: string; transitionIn?: TransitionName; background?: BackgroundOverride }
    | { id: string; type: 'center'; props: CenterProps; notes?: string; transitionIn?: TransitionName; background?: BackgroundOverride }
    | { id: string; type: 'steps';  props: StepsProps;  notes?: string; transitionIn?: TransitionName; background?: BackgroundOverride }
    | { id: string; type: 'quote';  props: QuoteProps;  notes?: string; transitionIn?: TransitionName; background?: BackgroundOverride }
    | { id: string; type: 'media';  props: MediaProps;  notes?: string; transitionIn?: TransitionName; background?: BackgroundOverride };

  export type MediaRef = { kind: 'image' | 'video' | 'none'; src?: string; alt?: string };
  export type BackgroundOverride = Partial<Pick<DeckSettings, 'backgroundMode'|'backgroundColor'|'backgroundImage'|'darken'|'blur'>>;
  ```
  - `id` MUST be URL-safe slug; uniqueness enforced by reducer (Step 28).
- **Acceptance:** `tsc --noEmit` passes; constructing `{ type: 'quote', props: { steps: [] } }` is a type error.

### Step 26 — `Deck` TS type
- **Goal:** Top-level container with metadata and ordered slides.
- **Files:** `src/components/slides/types.ts` (same file).
- **Contract:**
  ```ts
  export type Deck = {
    id: string;                // slug, unique per browser
    title: string;
    slides: Slide[];           // ordered; min 1
    settings: DeckSettings;
    createdAt: number;         // epoch ms
    updatedAt: number;         // epoch ms, bumped by every reducer
    version: 1;                // bump on breaking schema change
  };
  ```
  - Deck `id` derived from `title` slug at creation; renaming does NOT change id.
  - `version: 1` lets future loaders detect old payloads in localStorage and migrate.
- **Acceptance:** `Deck` exported; `version` literal type forces `1` only.

### Step 27 — `DeckSettings` type
- **Goal:** All deck-wide presentation prefs in one object.
- **Files:** `src/components/slides/types.ts`.
- **Contract:**
  ```ts
  export type DeckSettings = {
    theme: 'light' | 'dark';                       // default 'dark'
    backgroundMode: 'color' | 'image';             // default 'color'
    backgroundColor: string;                       // CSS color, default var(--slide-bg) literal '#101010'
    backgroundImage?: string;                      // URL or data: URL
    darken: number;                                // 0..100, default 0
    blur: number;                                  // 0..20 px, default 0
    transition: TransitionName;                    // default 'camera-zoom'
    isSoundEnabled: boolean;                       // default true
    volume: number;                                // 0..100, default 60
  };
  export const DEFAULT_SETTINGS: DeckSettings = { /* exact defaults above */ };
  ```
- **Validation:** A `validateSettings(input: unknown): DeckSettings` clamps numbers and falls back to defaults on bad input. Used by `importDeck` and on localStorage hydrate.
- **Acceptance:** `DEFAULT_SETTINGS` exported; clamping `darken: 150` returns `100`.

### Step 28 — Zustand `useDeck` store
- **Goal:** Single source of truth for the active deck; React components subscribe via selectors.
- **Files:** `src/components/slides/store.ts`.
- **Contract:**
  ```ts
  type DeckState = {
    deck: Deck;
    // selectors
    slideIndex: (id: string) => number;
    // actions
    setTitle(title: string): void;
    setSettings(patch: Partial<DeckSettings>): void;
    addSlide(slide: Slide, atIndex?: number): void;
    deleteSlide(id: string): void;
    reorder(fromIndex: number, toIndex: number): void;
    duplicate(id: string): void;
    updateSlide(id: string, patch: Partial<Slide>): void;
    replaceDeck(next: Deck): void;
  };
  export const useDeck = create<DeckState>()((set, get) => ({ … }));
  ```
  - Every mutating action MUST bump `deck.updatedAt = Date.now()`.
  - Reducers immutably clone `slides` array (no in-place mutation).
  - `addSlide` rejects duplicate `id`; auto-suffixes `-2`, `-3`, … via helper.
  - Selectors are pure; components MUST use `useDeck(selector, shallow)` for list reads to avoid re-render storms.
- **Acceptance:** A 5-slide deck after `reorder(0,4)` returns the original slide 0 in position 4; `updatedAt` advanced.

### Step 29 — localStorage autosave (debounced 500 ms)
- **Goal:** Survive reloads without saving on every keystroke.
- **Files:** `src/components/slides/store.ts` (same file) + `src/components/slides/persist.ts`.
- **Contract:**
  - Key: `slides:deck:${deck.id}`; index key `slides:decks` listing all known deck ids.
  - On store subscribe: debounce 500 ms, then `localStorage.setItem(key, JSON.stringify(deck))`.
  - On store create: read `slides:deck:${activeId}`, run `validateDeck` (Step 30), hydrate; on failure, fall back to seed deck (Step 31) and `console.warn` (no toast).
  - Quota errors: catch `QuotaExceededError`, call `toast.error('Storage full — export to keep changes')`.
- **Acceptance:** Rapid 20 reorder actions trigger exactly one `setItem` call after 500 ms idle.

### Step 30 — JSON import/export helpers
- **Goal:** Round-trip a deck as a single `.json` file for sharing/backup.
- **Files:** `src/components/slides/io.ts`.
- **Contract:**
  ```ts
  export function exportDeck(deck: Deck): Blob;          // application/json, pretty-printed (2-space)
  export function downloadDeck(deck: Deck): void;        // triggers <a download> for `${slug(deck.title)}.deck.json`
  export function importDeck(input: unknown): Deck;       // throws Error('Invalid deck') on schema mismatch
  export function validateDeck(input: unknown): Deck | null; // non-throwing variant for hydrate
  ```
  - Validation rules: `version === 1`; `slides.length >= 1`; every slide `id` matches `/^[a-z0-9-]+$/`; every slide `type` in `SlideType` union; `props` shape matches its discriminator (delegate to `validateSlide`).
  - Future-proofing: unknown extra fields are stripped, not rejected.
  - Errors surface as `toast.error(err.message)` at call site, not inside helpers.
- **Acceptance:** Export → import round-trip yields a deep-equal `Deck` (modulo `updatedAt` being refreshed on import).

## Steps 31–40 — Seed Deck, Reducer Tests, Slide Type Components A–D

### Step 31 — Seed example deck reproducing the three sample thumbnails
- **Goal:** First-run users see a populated deck that visually matches `/spec/01..03-sample.*` so the engine is testable end-to-end without authoring.
- **Files:** `src/components/slides/seed.ts`.
- **Contract:**
  ```ts
  import type { Deck } from './types';
  import { DEFAULT_SETTINGS } from './types';

  export const SEED_DECK: Deck = {
    id: 'sample-deck',
    title: 'Sample Deck',
    version: 1,
    createdAt: 0, updatedAt: 0,
    settings: { ...DEFAULT_SETTINGS, transition: 'camera-zoom' },
    slides: [
      { id: 'intro', type: 'left',
        props: { kicker: 'Riseup Asia', title: 'Build like you mean it.',
                 subtitle: 'A field guide for founders shipping under pressure.',
                 media: { kind: 'image', src: '/assets/samples/01-sample.webp', alt: 'cover' } },
        notes: 'Opens the workshop. 60s.' },
      { id: 'principles', type: 'center',
        props: { title: 'Move fast — finish faster.',
                 highlight: { text: 'finish faster', pill: true } },
        notes: 'Land the core idea before anything else.' },
      { id: 'process', type: 'steps',
        props: { title: 'How we ship',
                 steps: ['Draft in public', 'Cut scope twice', 'Ship to one user', 'Measure, then learn', 'Repeat weekly'] },
        notes: 'Walk each step; pause after step 3.' },
      { id: 'quote', type: 'quote',
        props: { quote: 'Done is the engine of more.',
                 author: 'Bre Pettis & Kio Stark', role: 'The Cult of Done Manifesto' } },
    ],
  };
  ```
  - `createdAt` / `updatedAt` filled by store on first hydrate (so seeded decks don't ship hard-coded timestamps).
  - Seed deck is **read-only template**: when store hydrates from empty storage, it clones via `structuredClone(SEED_DECK)` and assigns timestamps.
- **Acceptance:** Cold load of `/slides/intro` shows the cover; `/slides/principles` shows the yellow pill behind "finish faster"; `/slides/process` shows 5 steps; `/slides/quote` shows the quote slide.

### Step 32 — Vitest reducer tests for store
- **Goal:** Lock the contract of `add / delete / reorder / duplicate / updateSlide` against regressions.
- **Files:** `src/components/slides/store.test.ts`.
- **Contract — minimum cases:**
  ```ts
  describe('useDeck reducers', () => {
    test('addSlide appends by default and bumps updatedAt', …);
    test('addSlide(atIndex) inserts at the given position', …);
    test('addSlide rejects duplicate id by auto-suffixing -2', …);
    test('deleteSlide removes by id; leaves order stable', …);
    test('deleteSlide on last remaining slide is a no-op + warns', …);
    test('reorder(from,to) preserves length and other items', …);
    test('reorder out-of-range clamps without throwing', …);
    test('duplicate(id) inserts copy directly after source with new id', …);
    test('updateSlide(id, patch) deep-merges props', …);
    test('replaceDeck swaps entire deck and bumps updatedAt', …);
  });
  ```
  - Each test resets store via `useDeck.setState({ deck: structuredClone(SEED_DECK) })`.
  - Use `vi.useFakeTimers()` to assert `updatedAt` advances exactly once per action.
  - Last-slide deletion: assert `console.warn` called via `vi.spyOn(console, 'warn')`.
- **Acceptance:** `bunx vitest run src/components/slides/store.test.ts` → 10 passing.

### Step 33 — `LeftSlide.tsx` — Type A
- **Goal:** Match `01-sample.webp`: large heading on the left ~45% column, media in the right ~55% column.
- **Files:** `src/components/slides/types/LeftSlide.tsx`.
- **Contract:**
  ```tsx
  type Props = LeftProps & { theme?: 'light'|'dark'; chrome?: { topLeft?: ReactNode; topRight?: ReactNode; bottomLeft?: ReactNode; bottomRight?: ReactNode } };
  export function LeftSlide({ kicker, title, subtitle, media, theme, chrome }: Props) {
    return (
      <SlideLayout theme={theme} {...chrome}>
        <div className="grid h-full" style={{ gridTemplateColumns: '45fr 55fr', gap: 64 }}>
          <div className="flex flex-col justify-center">
            {kicker && <div className="slide-kicker mb-6 text-slide-muted">{kicker}</div>}
            <h1 className="slide-title-lg">{title}</h1>
            {subtitle && <p className="slide-body-lg mt-10 max-w-[920px] text-slide-muted">{subtitle}</p>}
          </div>
          <MediaSlot media={media} />
        </div>
      </SlideLayout>
    );
  }
  ```
  - `MediaSlot`: if `media.kind === 'image'` → `<img>` covering column with `object-fit: cover`, `border-radius: 32px`; `video` → autoplay muted loop; `none` → render an `.slide-decor` placeholder gradient.
  - Title max-width 850 px (≈ 50–60 chars at 104 px).
  - Grid gap 64 px slide-space.
- **Acceptance:** Rendering with the seed `intro` slide produces a layout visually matching `01-sample.webp` within 8 px tolerance.

### Step 34 — LeftSlide refinements: vertical centering, kicker, padding
- **Goal:** Make LeftSlide flexible without forking — explicit knobs for the three most common tweaks.
- **Files:** Extend `LeftSlide.tsx` (same file as Step 33).
- **Contract — additional props:**
  ```ts
  type LeftSlideExtras = {
    align?: 'top' | 'center' | 'bottom';        // default 'center'
    leftPadding?: number;                         // px, default 0 (SlideLayout already insets 96)
    kickerColor?: string;                         // CSS color, default var(--slide-muted)
    titleClassName?: string;                      // escape hatch for one-off sizing
  };
  ```
  - `align` → wrap left column with `justify-start | justify-center | justify-end`.
  - `leftPadding` → additional `paddingLeft: ${leftPadding}px` on the left column (cumulative with SlideLayout inset).
  - When `kicker` absent, do NOT reserve vertical space (no empty `<div>`).
  - When `subtitle` absent, title remains visually centered (no offset).
- **Acceptance:** Switching `align` between top/center/bottom moves the column without resizing it; removing kicker shifts title up by ~28 px (its prior margin).

### Step 35 — `CenterTextSlide.tsx` — Type B
- **Goal:** Match `02-sample.webp`: huge centered headline, optional one-line subtitle, optional inline highlight phrase.
- **Files:** `src/components/slides/types/CenterTextSlide.tsx`.
- **Contract:**
  ```tsx
  export function CenterTextSlide({ title, subtitle, highlight, theme, chrome }: Props) {
    const titleNode = highlight
      ? renderWithHighlight(title, highlight.text, highlight.pill ?? false)
      : title;
    return (
      <SlideLayout theme={theme} {...chrome}>
        <div className="flex h-full flex-col items-center justify-center text-center" style={{ paddingInline: 160 }}>
          <h1 className="slide-title-lg" style={{ maxWidth: 1500 }}>{titleNode}</h1>
          {subtitle && <p className="slide-body-lg mt-12 max-w-[1100px] text-slide-muted">{subtitle}</p>}
        </div>
      </SlideLayout>
    );
  }
  ```
  - `renderWithHighlight(full, phrase, pill)`: case-insensitive search for `phrase` in `full`; split into `[before, match, after]`; wrap match in `<Highlight pill={pill}>{match}</Highlight>`; if not found, render full string unchanged (no error, no warn — defensive).
  - Center alignment via flex, not text-align — keeps `.hl-pill` baseline correct (text-align cuts pill shadow).
- **Acceptance:** Seed `principles` slide renders "Move fast — **finish faster**." with a yellow pill behind "finish faster".

### Step 36 — Auto-detect `<Highlight pill>` children in CenterTextSlide
- **Goal:** Let authors write JSX directly when `props.title` is a ReactNode instead of a string (advanced usage).
- **Files:** `CenterTextSlide.tsx` (same file).
- **Contract — extend `CenterProps`:**
  ```ts
  export type CenterProps =
    | { title: string;     subtitle?: string; highlight?: { text: string; pill?: boolean } }
    | { title: ReactNode;  subtitle?: string };   // when title is JSX, ignore `highlight`
  ```
  - In component: if `typeof title === 'string'` AND `highlight` present → use `renderWithHighlight`; else render `title` as-is.
  - When a child of `title` is `<Highlight pill>` and the parent uses `text-align: center` — DON'T. Always use flex centering (see Step 35) so the pill's `box-shadow` is not clipped by line-box.
  - Provide a dev-only warning if a `<Highlight>` is detected inside a `text-center` ancestor (use `useEffect` + DOM query on the title ref).
- **Acceptance:** Passing `title={<>Move fast — <Highlight pill>finish faster</Highlight></>}` renders identically to the string + highlight variant.

### Step 37 — `StepsSlide.tsx` — Type C (structure only)
- **Goal:** Match `03-sample.jpg`: numbered list of up to 5 steps stacked vertically; step reveal controlled by URL `$step` param.
- **Files:** `src/components/slides/types/StepsSlide.tsx`.
- **Contract:**
  ```tsx
  type Props = StepsProps & { step: number; theme?: 'light'|'dark'; chrome?: ChromeSlots };
  // step is 0-indexed; valid range [0, steps.length - 1]; values outside are clamped.
  ```
  - Layout: `SlideLayout` with `topLeft={title}` slot when `title` present; main area = vertical flex with `gap: 36px`.
  - Each step rendered as a row:
    - Number badge: 88×88 px circle, `.slide-title` size, `bg-slide-hl text-slide-hl-ink` for **active** step; `bg-slide-muted/15 text-slide-muted` for inactive/future steps.
    - Step text: `.slide-body-lg`, max-width 1400 px, color `--slide-fg` for revealed, `--slide-muted` at 40% opacity for unrevealed.
  - `steps.length` guard: render first 5; if more, slice and `console.warn('StepsSlide: max 5 steps; extras ignored')`.
  - Container reserves top 120 / bottom 90 (default `SlideLayout` reserves); 5 steps × ~120 px row ≈ 600 px → fits in 870 px content area with headroom.
- **Acceptance:** With `steps: [a,b,c,d,e]` and `step=2`, badges 1–3 are yellow; 4–5 are muted; row heights identical regardless of revealed state (no layout shift).

### Step 38 — Read `$step` URL param + clamping
- **Goal:** The URL is the source of truth for which step is active. Refresh keeps you on the same step.
- **Files:** `src/routes/slides.$slideId.$step.tsx` (route shell; full route in Step 51).
- **Contract:**
  - Param is string in the URL (`$step`); parsed once with `Number.parseInt(raw, 10)`.
  - Validation: integer ≥ 1 (URL is **1-indexed** for humans), ≤ `slide.props.steps.length`.
  - Out-of-range → `redirect({ to: '/slides/$slideId/$step', params: { slideId, step: String(clamped) } })` in `beforeLoad`.
  - Non-numeric (`/slides/process/abc`) → redirect to step 1.
  - Pass `step={parsed - 1}` (0-indexed) into `<StepsSlide>`.
  - Only valid for slides where `slide.type === 'steps'`; for other types redirect to `/slides/$slideId` (drop the step segment).
- **Acceptance:** Visiting `/slides/process/3` shows steps 1–3 revealed; `/slides/process/99` redirects to `/slides/process/5`; `/slides/intro/2` redirects to `/slides/intro`.

### Step 39 — Animate newly revealed step using deck transition
- **Goal:** When `$step` increments, only the new step animates in — not the whole slide.
- **Files:** `StepsSlide.tsx` (same file as Step 37).
- **Contract:**
  - Each row keyed by index. Wrap each row in `<motion.div>` with:
    - `initial`: chosen per `deck.settings.transition`:
      - `camera-zoom` → `{ opacity: 0, z: -180, filter: 'blur(8px)' }` (in a `transform-style: preserve-3d` parent)
      - `morph`       → `{ opacity: 0, scale: 0.96, y: 12 }`
      - `fade`        → `{ opacity: 0, y: 12 }`
      - `eaten`       → `{ opacity: 0, x: -60, filter: 'blur(6px)' }`
    - `animate`: revealed → `{ opacity: 1, z: 0, scale: 1, x: 0, y: 0, filter: 'blur(0px)' }`; unrevealed → `{ opacity: 0.35, filter: 'blur(0px)' }` (muted, no movement).
    - `transition`: duration = `useReducedMotion() ? 0.15 : 0.45`; ease `[0.22, 1, 0.36, 1]` (cubic-out).
  - Use `layoutId={`step-${slideId}-${i}`}` so reordering or step-jumping doesn't flicker.
  - On reveal increment: `triggerWhoosh()` ONLY if `deck.settings.transition === 'camera-zoom'` AND not reduced-motion (re-uses `src/components/slides/audio.ts`).
  - Previously-revealed steps DO NOT re-animate when a later step is revealed (motion's `AnimatePresence` not needed here; rely on `animate` prop diff).
- **Acceptance:** Pressing `→` from `/slides/process/2` to `/3` animates only the third row; rows 1–2 stay still; whoosh plays once.

### Step 40 — `QuoteSlide.tsx` — Type D
- **Goal:** Editorial quote layout: oversized open-quote glyph, big quote text, attribution row.
- **Files:** `src/components/slides/types/QuoteSlide.tsx`.
- **Contract:**
  ```tsx
  type Props = QuoteProps & { theme?: 'light'|'dark'; chrome?: ChromeSlots };
  export function QuoteSlide({ quote, author, role, avatar, theme, chrome }: Props) {
    return (
      <SlideLayout theme={theme} {...chrome}>
        <div className="flex h-full flex-col justify-center" style={{ paddingInline: 160 }}>
          <div aria-hidden className="font-display leading-none text-slide-hl" style={{ fontSize: 320, height: 200, marginBottom: 24 }}>“</div>
          <blockquote className="slide-title" style={{ maxWidth: 1500 }}>{quote}</blockquote>
          <figcaption className="mt-12 flex items-center gap-6">
            {avatar && <img src={avatar} alt="" className="rounded-[28%]" style={{ width: 96, height: 96, objectFit: 'cover' }} />}
            <div>
              <div className="slide-body-lg">{author}</div>
              {role && <div className="slide-caption text-slide-muted">{role}</div>}
            </div>
          </figcaption>
        </div>
      </SlideLayout>
    );
  }
  ```
  - Open-quote glyph: `aria-hidden`, decorative only; pulled from display font so curl matches headings.
  - Avatar uses **squircle** via `border-radius: 28%` (rounded but not pure circle) to match modern editorial style.
  - When `avatar` absent, attribution starts at left margin (no empty placeholder).
  - Quote wraps at ~50 ch; if quote is shorter than one line, the layout still vertically centers.
- **Acceptance:** Seed `quote` slide renders with large open-quote, the quote in `.slide-title`, and "Bre Pettis & Kio Stark / The Cult of Done Manifesto" in the attribution.

## Steps 41–50 — Media stub, Notes, Overrides, Chrome, BrandBar, Demo, Snapshots, Slides layout, $slideId route

### Step 41 — `MediaFullSlide.tsx` (stub for v1)
- **Goal:** Reserve the `'media'` slide type slot so the discriminated union compiles, but defer full implementation to v2.
- **Files:** `src/components/slides/types/MediaFullSlide.tsx`.
- **Contract:**
  ```tsx
  // TODO(v2): full-bleed image/video slide with Ken-Burns + caption overlay.
  export function MediaFullSlide({ src, kind, caption }: MediaProps) {
    return (
      <SlideLayout>
        <div className="flex h-full items-center justify-center bg-black">
          {kind === 'image'
            ? <img src={src} alt={caption ?? ''} className="h-full w-full object-cover" />
            : <video src={src} autoPlay muted loop playsInline className="h-full w-full object-cover" />}
          {caption && (
            <div className="absolute bottom-24 left-24 slide-caption text-white/90 max-w-[900px]
                            bg-black/40 px-6 py-3 rounded-lg backdrop-blur-sm">{caption}</div>
          )}
        </div>
      </SlideLayout>
    );
  }
  ```
  - Marked stub by single `TODO(v2):` comment at top. No Ken-Burns, no advanced controls.
  - Renders only when registry hits it; not used by seed deck (so v1 visual QA isn't blocked on it).
- **Acceptance:** TS compile passes; manually pushing `{ type: 'media', props: { kind: 'image', src: '/assets/samples/01-sample.webp' } }` into a deck renders full-bleed image.

### Step 42 — Per-slide `notes` rendered in Presenter view
- **Goal:** Speaker notes accessible during presentation without leaking to audience screen.
- **Files:** `src/components/slides/PresenterNotes.tsx` + integration in `src/routes/slides.$slideId.tsx`.
- **Contract:**
  ```tsx
  // PresenterNotes.tsx
  type Props = { notes?: string; isVisible: boolean };
  export function PresenterNotes({ notes, isVisible }: Props) {
    if (!isVisible) return null;
    return (
      <aside className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50
                        max-w-[820px] max-h-[35vh] overflow-y-auto
                        rounded-2xl bg-background/95 backdrop-blur px-6 py-5 shadow-2xl border">
        <h2 className="text-sm font-semibold text-muted-foreground mb-2">Notes</h2>
        <p className="text-base leading-relaxed whitespace-pre-wrap">
          {notes?.trim() || <em className="text-muted-foreground">No notes for this slide.</em>}
        </p>
      </aside>
    );
  }
  ```
  - Visibility toggled by `N` keyboard shortcut → `useSlideKeyboard({ onNotes: () => setShow(v => !v) })`.
  - State **local to route component** (not in store) — notes panel preference does NOT autosave.
  - In Fullscreen Present mode: notes are HIDDEN on the projected screen by default; visible only when explicitly toggled with `N` (presenter use only, no audience leak unless toggled).
  - Notes element is `<aside>` and uses `app-chrome` text (not `.slide-*` semantic), since it's outside the 1920×1080 stage.
- **Acceptance:** Press `N` → notes overlay appears/disappears; reload preserves nothing (intentional).

### Step 43 — Per-slide `background` override
- **Goal:** Let a single slide break from deck background (e.g., a dark hero in a light deck).
- **Files:** Wire-up in `src/components/slides/RenderSlide.tsx` (the dispatcher).
- **Contract:**
  - `BackgroundOverride` (defined Step 25) partially overrides deck settings.
  - Resolution order (later wins): `DEFAULT_SETTINGS` → `deck.settings.{backgroundMode,backgroundColor,backgroundImage,darken,blur}` → `slide.background?.*`.
  - Implement once via:
    ```ts
    function resolveBackground(deck: DeckSettings, slide?: BackgroundOverride) {
      return {
        backgroundMode:  slide?.backgroundMode  ?? deck.backgroundMode,
        backgroundColor: slide?.backgroundColor ?? deck.backgroundColor,
        backgroundImage: slide?.backgroundImage ?? deck.backgroundImage,
        darken:          slide?.darken          ?? deck.darken,
        blur:            slide?.blur            ?? deck.blur,
      };
    }
    ```
  - Pass the resolved object to `<SlideLayout background={…}>`.
  - Override applies only to background; theme stays deck-controlled (use a separate slide-level `theme` field if needed in v2).
- **Acceptance:** Adding `background: { backgroundMode: 'image', backgroundImage: '/assets/samples/03-sample.jpg', darken: 60 }` to one slide changes only that slide.

### Step 44 — Per-slide `transitionIn` override
- **Goal:** Author can pin one transition per slide (e.g., quote slide always fades regardless of deck setting).
- **Files:** `src/components/slides/SlideTransition.tsx` (extend existing).
- **Contract:**
  - `SlideTransition` reads `transitionIn` prop FROM THE NEW (incoming) slide, NOT the outgoing one (a transition belongs to the slide you're entering).
  - Resolution: `slide.transitionIn ?? deck.settings.transition ?? 'camera-zoom'`.
  - If `useReducedMotion()` → force `'fade'` regardless of override.
  - Override applies to BOTH slide-to-slide change AND step-to-step (for StepsSlide).
  - The `<motion.div>` key remains `${slideId}` (slide) or `${slideId}:${step}` (step) — only the variant changes.
- **Acceptance:** Setting `transitionIn: 'eaten'` on the quote slide produces the eaten-text effect when navigating to it; other slides still use the deck default.

### Step 45 — `AppChromeDecorator` matching `03-sample.jpg`
- **Goal:** Optional decorative "browser window" frame that wraps slide content, matching the fake app-chrome look in the third sample image.
- **Files:** `src/components/slides/AppChromeDecorator.tsx`.
- **Contract:**
  ```tsx
  type Props = { children: ReactNode; url?: string; title?: string; tone?: 'light'|'dark' };
  export function AppChromeDecorator({ children, url = 'riseup.asia', title, tone = 'light' }: Props) {
    return (
      <div className={cn('h-full w-full p-12', tone === 'light' ? 'bg-[#F4EFE4]' : 'bg-[#101010]')}>
        <div className="h-full w-full rounded-[32px] overflow-hidden shadow-[0_60px_120px_-30px_rgba(0,0,0,0.45)] border border-black/10 bg-white flex flex-col">
          {/* title bar */}
          <div className="flex items-center gap-3 px-6 py-4 border-b bg-[#FAF7F0]">
            <span className="h-4 w-4 rounded-full bg-[#FF5F57]" />
            <span className="h-4 w-4 rounded-full bg-[#FEBC2E]" />
            <span className="h-4 w-4 rounded-full bg-[#28C840]" />
            <div className="ml-6 flex-1 rounded-full bg-white border px-5 py-1.5 text-sm text-zinc-500 text-center">
              {url}
            </div>
            {title && <div className="text-sm text-zinc-500 ml-4">{title}</div>}
          </div>
          <div className="flex-1 min-h-0">{children}</div>
        </div>
      </div>
    );
  }
  ```
  - Outer padding 48 px slide-space so the chrome floats with a bone-colored margin.
  - Traffic-light dots scale visually because the parent is inside `.slide-content` (already scaled).
  - Slides opt in by setting `chromeDecorator: 'app'` on the slide (registered handling in `RenderSlide`); v1 only `'app' | 'none'` supported.
- **Acceptance:** Rendering the `process` slide with `chromeDecorator: 'app'` produces the bone-margin app-window look matching `03-sample.jpg`.

### Step 46 — `BrandBar` (RiseupAsia / RiseupPro lockups)
- **Goal:** Standard footer lockup usable as any chrome slot.
- **Files:** `src/components/slides/BrandBar.tsx` + word-mark SVGs at `src/assets/brand/riseup-asia.svg`, `src/assets/brand/riseup-pro.svg`.
- **Contract:**
  ```tsx
  type Props = { variant?: 'asia'|'pro'; tone?: 'on-light'|'on-dark'; size?: number /* px height, default 28 */ };
  export function BrandBar({ variant = 'asia', tone = 'on-dark', size = 28 }: Props) {
    const src = variant === 'pro' ? RiseupProLogo : RiseupAsiaLogo;
    return (
      <div className="flex items-center gap-3 slide-chrome">
        <img src={src} alt={variant === 'pro' ? 'Riseup Pro' : 'Riseup Asia'} style={{ height: size }}
             className={tone === 'on-dark' ? 'invert-0' : 'invert'} />
      </div>
    );
  }
  ```
  - SVG word-marks ship monochrome; `tone` flips via CSS `invert()` (avoids shipping two color variants).
  - Used in chrome slots like `bottomLeft={<BrandBar variant="pro" />}`.
  - SVGs are placeholder lockups in v1 (simple Ubuntu-set text rendered as `<text>`), replaceable later without touching `BrandBar`.
- **Acceptance:** Brand bar renders 28 px tall in any slot; switching `tone` flips color correctly on a dark slide.

### Step 47 — `/slides/demo` route — one of each slide type
- **Goal:** Single page that exercises every slide component for visual regression review.
- **Files:** `src/routes/slides.demo.tsx`.
- **Contract:**
  ```tsx
  export const Route = createFileRoute('/slides/demo')({ component: DemoPage });
  function DemoPage() {
    return (
      <div className="min-h-screen bg-background p-8 space-y-12">
        {DEMO_SLIDES.map((s, i) => (
          <section key={s.id} className="space-y-3">
            <h2 className="text-sm uppercase tracking-wider text-muted-foreground">{i + 1}. {s.type} — {s.title}</h2>
            <div className="aspect-video rounded-xl overflow-hidden border bg-black">
              <ScaledSlide><RenderSlide slide={s} /></ScaledSlide>
            </div>
          </section>
        ))}
      </div>
    );
  }
  ```
  - `DEMO_SLIDES` includes one of each: `left`, `center` (with both inline and pill highlight), `steps` (at step 3 of 5), `quote`, `media` (stub), and one slide using `AppChromeDecorator`.
  - Demo route is NOT included in published presentations (excluded from grid view, not in `useDeck`).
  - Reading head meta: `title: 'Slides — Demo'`, `robots: 'noindex'`.
- **Acceptance:** Visiting `/slides/demo` shows ~6 scaled previews stacked vertically; no console errors; each thumbnail matches its corresponding spec sample.

### Step 48 — Vitest snapshot tests at 1920×1080 for every slide component
- **Goal:** Lock visual structure; regressions surface in CI before visual review.
- **Files:** `src/components/slides/types/__snapshots__/` (auto-generated) + `src/components/slides/types/slides.snap.test.tsx`.
- **Contract:**
  ```tsx
  import { render } from '@testing-library/react';
  import { describe, test, expect } from 'vitest';

  describe.each([
    ['LeftSlide',       <LeftSlide {...sampleLeft} />],
    ['CenterTextSlide', <CenterTextSlide {...sampleCenter} />],
    ['StepsSlide',      <StepsSlide {...sampleSteps} step={2} />],
    ['QuoteSlide',      <QuoteSlide {...sampleQuote} />],
    ['MediaFullSlide',  <MediaFullSlide {...sampleMedia} />],
  ])('%s renders at 1920×1080', (name, el) => {
    test('matches snapshot', () => {
      const { container } = render(el);
      // outer .slide-content must be 1920×1080 (verify via inline style)
      const content = container.querySelector('.slide-content') as HTMLElement;
      expect(content).toBeTruthy();
      expect(content.style.width).toBe('1920px');
      expect(content.style.height).toBe('1080px');
      expect(container.innerHTML).toMatchSnapshot();
    });
  });
  ```
  - jsdom does not compute layout; tests assert **structure + inline dimensions**, not pixel positions.
  - Snapshot diffs in PRs require human review (standard Vitest behavior).
  - Update snapshots intentionally with `bunx vitest -u`.
- **Acceptance:** First run creates 5 snapshot files; subsequent runs pass without changes.

### Step 49 — `src/routes/slides.tsx` — layout route + KeyboardScope
- **Goal:** Shared shell for every slide route — provides keyboard scope, ControlBar, SettingsDrawer, PresenterNotes.
- **Files:** `src/routes/slides.tsx`.
- **Contract:**
  ```tsx
  export const Route = createFileRoute('/slides')({
    head: () => ({ meta: [{ title: 'Slides' }, { name: 'robots', content: 'noindex' }] }),
    component: SlidesLayout,
  });

  function SlidesLayout() {
    return (
      <div className="fixed inset-0 bg-black overflow-hidden">
        <Outlet />
        <ControlBar />
        <SettingsDrawer />
        {/* PresenterNotes mounted by child routes to access slide-specific notes */}
      </div>
    );
  }
  ```
  - Outer is `fixed inset-0` so slides always fill the viewport regardless of app chrome.
  - `bg-black` provides letterbox color when slide aspect doesn't match viewport.
  - ControlBar and SettingsDrawer are mounted ONCE here so they persist across slide navigation (avoid remount/animation reset).
  - Index route `/slides` (no `$slideId`): show grid overview (Step 52).
  - Keyboard scope: child route attaches `useSlideKeyboard` (NOT here) so handlers can reference the active slide.
- **Acceptance:** Visiting any `/slides/*` route shows black background, slides fill viewport, ControlBar visible at bottom.

### Step 50 — `src/routes/slides.$slideId.tsx` — single slide route
- **Goal:** Render one slide by id; redirect on bad id; sync URL ↔ deck index.
- **Files:** `src/routes/slides.$slideId.tsx`.
- **Contract:**
  ```tsx
  export const Route = createFileRoute('/slides/$slideId')({
    beforeLoad: ({ params }) => {
      const deck = useDeck.getState().deck;
      const slide = deck.slides.find(s => s.id === params.slideId);
      if (!slide) {
        const first = deck.slides[0];
        throw redirect({ to: '/slides/$slideId', params: { slideId: first.id }, replace: true });
      }
      // If a 'steps' slide is hit without $step, redirect to step 1 for explicit URL.
      if (slide.type === 'steps') {
        throw redirect({ to: '/slides/$slideId/$step', params: { slideId: slide.id, step: '1' }, replace: true });
      }
    },
    component: SlidePage,
  });

  function SlidePage() {
    const { slideId } = Route.useParams();
    const navigate = useNavigate();
    const { deck } = useDeck();
    const idx = deck.slides.findIndex(s => s.id === slideId);
    const slide = deck.slides[idx];

    // Title sync
    useEffect(() => {
      document.title = `${idx + 1}/${deck.slides.length} — ${deckSlideTitle(slide)}`;
    }, [slideId, idx, deck.slides.length, slide]);

    // Keyboard
    useSlideKeyboard({
      onPrev: () => idx > 0 && navigate({ to: '/slides/$slideId', params: { slideId: deck.slides[idx - 1].id } }),
      onNext: () => idx < deck.slides.length - 1 && navigate({ to: '/slides/$slideId', params: { slideId: deck.slides[idx + 1].id } }),
      onGrid: () => navigate({ to: '/slides' }),
      onPresent: () => document.documentElement.requestFullscreen?.(),
      onEscape: () => document.exitFullscreen?.(),
      onJump: (n) => { const t = deck.slides[n - 1]; if (t) navigate({ to: '/slides/$slideId', params: { slideId: t.id } }); },
    });

    return (
      <ScaledSlide>
        <SlideTransition transitionKey={slide.id} transitionIn={slide.transitionIn ?? deck.settings.transition}>
          <RenderSlide slide={slide} />
        </SlideTransition>
      </ScaledSlide>
    );
  }
  ```
  - `deckSlideTitle(slide)` helper extracts a human title from each slide type (e.g., `slide.props.title ?? slide.props.quote ?? slide.id`).
  - Replace `history.replaceState` style: TanStack navigate with `replace: false` (default) so back/forward step through deck — standard presentation expectation.
  - `idx === -1` impossible at runtime (beforeLoad guards), but `slide` access still nullish-guards in render (returns `null` and logs once).
- **Acceptance:** `/slides/intro` shows seed cover; `→` advances to `/slides/principles`; `←` returns; `/slides/bogus` redirects to `/slides/intro`; tab title shows `1/4 — Build like you mean it.`

## Steps 51–60 — Step route, Grid, Print, Title sync, Keyboard scope, ControlBar, Jump input, Share, Grid mode, Fullscreen

### Step 51 — `src/routes/slides.$slideId.$step.tsx` — Type C step coordinate
- **Goal:** Per-step URL for `StepsSlide` reveal so a deep link can land on `/slides/process/3` and resume mid-build.
- **Files:** `src/routes/slides.$slideId.$step.tsx`.
- **Contract:**
  ```tsx
  export const Route = createFileRoute('/slides/$slideId/$step')({
    beforeLoad: ({ params }) => {
      const deck = useDeck.getState().deck;
      const slide = deck.slides.find(s => s.id === params.slideId);
      if (!slide) throw redirect({ to: '/slides/$slideId', params: { slideId: deck.slides[0].id }, replace: true });
      if (slide.type !== 'steps') {
        throw redirect({ to: '/slides/$slideId', params: { slideId: slide.id }, replace: true });
      }
      const parsed = Number.parseInt(params.step, 10);
      const max = slide.props.steps.length;
      const clamped = Math.min(Math.max(Number.isFinite(parsed) ? parsed : 1, 1), max);
      if (String(clamped) !== params.step) {
        throw redirect({ to: '/slides/$slideId/$step', params: { slideId: slide.id, step: String(clamped) }, replace: true });
      }
    },
    component: StepPage,
  });

  function StepPage() {
    const { slideId, step } = Route.useParams();
    const stepNum = Number.parseInt(step, 10);
    const navigate = useNavigate();
    const { deck } = useDeck();
    const idx = deck.slides.findIndex(s => s.id === slideId);
    const slide = deck.slides[idx] as Extract<Slide, { type: 'steps' }>;
    const max = slide.props.steps.length;

    useEffect(() => { document.title = `${idx + 1}.${stepNum} — ${slide.props.title ?? slide.id}`; },
      [idx, stepNum, slide]);

    useSlideKeyboard({
      onPrev: () => {
        if (stepNum > 1) navigate({ to: '/slides/$slideId/$step', params: { slideId, step: String(stepNum - 1) } });
        else if (idx > 0) navigate({ to: '/slides/$slideId', params: { slideId: deck.slides[idx - 1].id } });
      },
      onNext: () => {
        if (stepNum < max) navigate({ to: '/slides/$slideId/$step', params: { slideId, step: String(stepNum + 1) } });
        else if (idx < deck.slides.length - 1) navigate({ to: '/slides/$slideId', params: { slideId: deck.slides[idx + 1].id } });
      },
      onGrid: () => navigate({ to: '/slides' }),
      onPresent: () => document.documentElement.requestFullscreen?.(),
      onEscape: () => document.exitFullscreen?.(),
    });

    return (
      <ScaledSlide>
        <SlideTransition transitionKey={`${slide.id}:${stepNum}`} transitionIn={slide.transitionIn ?? deck.settings.transition}>
          <StepsSlide {...slide.props} step={stepNum - 1} />
        </SlideTransition>
      </ScaledSlide>
    );
  }
  ```
  - URL `$step` is 1-indexed for humans; component uses 0-indexed `step` prop.
  - `→` past last step advances to next slide; `←` before step 1 returns to previous slide. Mirrors PowerPoint/Keynote behavior.
- **Acceptance:** `/slides/process/3` reveals first 3 steps; `→` reveals 4th; `→` past 5 → `/slides/quote`; `←` from `/slides/process/1` → `/slides/principles`.

### Step 52 — `src/routes/slides.index.tsx` — grid overview
- **Goal:** `/slides` (no id) renders the full deck as a clickable thumbnail grid; also the destination of `G` shortcut.
- **Files:** `src/routes/slides.index.tsx`.
- **Contract:**
  ```tsx
  export const Route = createFileRoute('/slides/')({
    head: () => ({ meta: [{ title: 'Slides — Overview' }] }),
    component: GridPage,
  });
  function GridPage() {
    const navigate = useNavigate();
    const { deck } = useDeck();
    return (
      <div className="absolute inset-0 overflow-y-auto bg-zinc-950 p-10">
        <h1 className="text-white text-2xl font-semibold mb-8">{deck.title}</h1>
        <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))' }}>
          {deck.slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => navigate({ to: '/slides/$slideId', params: { slideId: s.id } })}
              className="group text-left"
            >
              <div className="aspect-video rounded-xl overflow-hidden bg-black border border-white/10
                              transition-transform group-hover:scale-[1.02] group-focus-visible:ring-2 ring-yellow-400">
                <ScaledSlide><RenderSlide slide={s} /></ScaledSlide>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm text-white/70">
                <span className="tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                <span className="truncate ml-3">{deckSlideTitle(s)}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }
  ```
  - Each cell uses `ScaledSlide` so thumbnails render the live slide component (no separate "thumbnail" code path).
  - Min cell width 360 px → 3–5 columns on a 1280–1920 viewport.
  - Cells are `<button>` for keyboard/screen-reader navigation; arrow-key navigation within grid deferred to v2.
- **Acceptance:** Visiting `/slides` shows all seed slides as thumbnails; clicking one navigates to `/slides/<id>`; `G` from any slide returns here.

### Step 53 — `src/routes/slides.print.tsx` — print/PDF route
- **Goal:** Single page that stacks every slide vertically at 1920×1080 for `Cmd+P → Save as PDF` output.
- **Files:** `src/routes/slides.print.tsx`.
- **Contract:**
  ```tsx
  export const Route = createFileRoute('/slides/print')({
    head: () => ({ meta: [{ title: 'Slides — Print' }, { name: 'robots', content: 'noindex' }] }),
    component: PrintPage,
  });
  function PrintPage() {
    const { deck } = useDeck();
    useEffect(() => {
      toast.info('Press Cmd/Ctrl+P to save as PDF. Set destination to "Save as PDF" and paper to Custom 1920×1080.');
    }, []);
    return (
      <div className="print-deck bg-zinc-100">
        {deck.slides.map(s => (
          <div key={s.id} className="slide-print-page">
            {/* For 'steps' slides, render at final step so PDF shows full content. */}
            {s.type === 'steps'
              ? <StepsSlide {...s.props} step={s.props.steps.length - 1} />
              : <RenderSlide slide={s} />}
          </div>
        ))}
      </div>
    );
  }
  ```
  - CSS additions to `src/styles.css`:
    ```css
    .slide-print-page { width: 1920px; height: 1080px; page-break-after: always; break-after: page; }
    @media print {
      @page { size: 1920px 1080px landscape; margin: 0; }
      body, html { margin: 0; padding: 0; background: white; }
      .print-deck { background: white !important; }
      /* Hide app chrome (ControlBar/SettingsDrawer) on print. */
      [data-app-chrome] { display: none !important; }
    }
    ```
  - ControlBar + SettingsDrawer tagged `data-app-chrome` so they hide on print.
  - Print route MUST NOT use `<ScaledSlide>` — the page is exactly 1920×1080, no scaling needed.
- **Acceptance:** `/slides/print` shows N pages stacked; Cmd+P → Save as PDF produces N-page PDF where each page matches the on-screen slide.

### Step 54 — `document.title` sync helper
- **Goal:** Centralize the title-sync logic so the format stays consistent across `$slideId` and `$step` routes.
- **Files:** `src/components/slides/useDocumentTitle.ts` + helper `deckSlideTitle(slide)`.
- **Contract:**
  ```ts
  export function deckSlideTitle(slide: Slide): string {
    switch (slide.type) {
      case 'left':   return slide.props.title;
      case 'center': return slide.props.title;
      case 'steps':  return slide.props.title ?? slide.id;
      case 'quote':  return `"${slide.props.quote.slice(0, 48)}${slide.props.quote.length > 48 ? '…' : ''}"`;
      case 'media':  return slide.props.caption ?? slide.id;
    }
  }
  export function useDocumentTitle(text: string) {
    useEffect(() => { const prev = document.title; document.title = text; return () => { document.title = prev; }; }, [text]);
  }
  ```
  - Format for single slide: `${i+1}/${total} — ${deckSlideTitle(slide)}`.
  - Format for step: `${i+1}.${stepNum}/${total} — ${deckSlideTitle(slide)}`.
  - Restore previous title on unmount so leaving `/slides` returns the app title.
- **Acceptance:** Switching from `/slides/intro` → `/slides/process/3` updates tab to `3.3/4 — How we ship`; navigating back to `/` restores root title.

### Step 55 — Keyboard scope on slides layout
- **Goal:** Single, canonical key map referenced by every slide route via `useSlideKeyboard` (already authored Step 22). This step is the **wire-up + documentation contract**.
- **Files:** `src/routes/slides.$slideId.tsx`, `src/routes/slides.$slideId.$step.tsx` (consumers).
- **Contract — bindings:**
  | Key | Action |
  |---|---|
  | `←` / `PageUp`               | Prev step → prev slide |
  | `→` / `PageDown` / `Space` / `Enter` | Next step → next slide |
  | `Shift+Space`                | Prev (presenter remote compat) |
  | `Home`                       | First slide |
  | `End`                        | Last slide |
  | `G`                          | Open grid (`/slides`) |
  | `F5`                         | Enter fullscreen present mode |
  | `Esc`                        | Exit fullscreen; close grid; cancel jump input |
  | `N`                          | Toggle PresenterNotes overlay |
  | `S`                          | Open Settings drawer |
  | `1–9` then `Enter`           | Jump to slide N (digit buffer, 500 ms timeout) |
  | `?`                          | Open keyboard cheatsheet modal (v2 placeholder, logs for now) |
- **Behavior:** Handlers ignored when focus is in `INPUT/TEXTAREA/[contenteditable]` (already in hook). Modifier-held keys (except Shift+Space) ignored.
- **Acceptance:** Every binding works on `/slides/intro` and `/slides/process/3`; typing into the jump-input does NOT trigger global handlers.

### Step 56 — `<ControlBar>` (prev / N/Total / next / share / export / settings)
- **Goal:** Persistent bottom toolbar visible on every `/slides/*` route except `/slides/print` and inside Fullscreen.
- **Files:** `src/components/slides/ControlBar.tsx`.
- **Contract:**
  ```tsx
  export function ControlBar() {
    const navigate = useNavigate();
    const { deck } = useDeck();
    const params = useParams({ strict: false }) as { slideId?: string; step?: string };
    const idx = deck.slides.findIndex(s => s.id === params.slideId);
    const total = deck.slides.length;
    if (idx === -1) return null;  // hide on grid/print

    return (
      <div data-app-chrome
           className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40
                      flex items-center gap-2 rounded-full bg-black/60 backdrop-blur-md
                      px-3 py-2 border border-white/10 text-white opacity-30 hover:opacity-100
                      transition-opacity">
        <IconButton aria-label="Previous" onClick={prev}><ChevronLeft className="h-4 w-4" /></IconButton>
        <SlideJumpInput idx={idx} total={total} />          {/* Step 57 */}
        <IconButton aria-label="Next" onClick={next}><ChevronRight className="h-4 w-4" /></IconButton>
        <div className="mx-1 h-5 w-px bg-white/15" />
        <IconButton aria-label="Share" onClick={shareCurrent}><Share2 className="h-4 w-4" /></IconButton>
        <IconButton aria-label="Export" onClick={() => navigate({ to: '/slides/print' })}><Printer className="h-4 w-4" /></IconButton>
        <IconButton aria-label="Grid" onClick={() => navigate({ to: '/slides' })}><LayoutGrid className="h-4 w-4" /></IconButton>
        <IconButton aria-label="Settings" onClick={openSettings}><Settings className="h-4 w-4" /></IconButton>
      </div>
    );
  }
  ```
  - Auto-fade: opacity 0.3 idle, 1.0 on hover; additionally, hide entirely when `document.fullscreenElement` is set AND mouse idle > 2 s (Step 60).
  - Bar uses **app chrome** typography (not `.slide-*` semantic) — it lives outside the scaled stage.
  - `IconButton` = compact 36×36 button with focus ring (`focus-visible:ring-2 ring-yellow-400`).
  - `data-app-chrome` attribute ensures `@media print` hides it (Step 53).
- **Acceptance:** Bar appears centered on bottom, fades on hover, all 7 controls work; hidden during print.

### Step 57 — Double-click `N` → editable input → Enter jumps; Esc cancels
- **Goal:** Quick slide jump without grid or digit-buffer.
- **Files:** `src/components/slides/SlideJumpInput.tsx`.
- **Contract:**
  ```tsx
  type Props = { idx: number; total: number };
  export function SlideJumpInput({ idx, total }: Props) {
    const [isEditing, setEditing] = useState(false);
    const [value, setValue] = useState(String(idx + 1));
    const navigate = useNavigate();
    const { deck } = useDeck();

    // Reset displayed value when navigation changes idx externally.
    useEffect(() => { if (!isEditing) setValue(String(idx + 1)); }, [idx, isEditing]);

    const commit = () => {
      const n = Math.min(Math.max(Number.parseInt(value, 10) || 1, 1), total);
      if (n !== idx + 1) navigate({ to: '/slides/$slideId', params: { slideId: deck.slides[n - 1].id } });
      else toast.info(`Already on slide ${n}`);
      setEditing(false);
    };
    const cancel = () => { setValue(String(idx + 1)); setEditing(false); };

    if (!isEditing) {
      return (
        <button onDoubleClick={() => setEditing(true)}
                className="px-3 text-sm tabular-nums text-white/85 hover:text-white">
          {idx + 1} <span className="text-white/40">/ {total}</span>
        </button>
      );
    }
    return (
      <div className="flex items-center gap-1 text-sm tabular-nums">
        <input
          autoFocus type="number" min={1} max={total} value={value}
          onChange={e => setValue(e.target.value)}
          onBlur={cancel}
          onKeyDown={e => { if (e.key === 'Enter') commit(); else if (e.key === 'Escape') cancel(); e.stopPropagation(); }}
          className="w-14 bg-white/10 rounded px-2 py-1 text-center outline-none focus:bg-white/20"
        />
        <span className="text-white/40">/ {total}</span>
      </div>
    );
  }
  ```
  - `e.stopPropagation()` on key events prevents global keyboard scope from also acting.
  - Out-of-range clamped silently (no error toast); equal to current → friendly info toast.
  - Blur cancels (no surprise commit).
- **Acceptance:** Double-click `3/4` → input appears focused with `3` selected; type `2` Enter → navigates to slide 2; Esc cancels without nav.

### Step 58 — Share button (`navigator.share` + clipboard fallback)
- **Goal:** Share the exact URL (slide + step) the presenter is currently on.
- **Files:** `src/components/slides/share.ts` + wire in `ControlBar`.
- **Contract:**
  ```ts
  export async function shareCurrent() {
    const url = window.location.href;
    const title = document.title;
    if (navigator.share) {
      try { await navigator.share({ title, url }); return; }
      catch (err) {
        if ((err as Error).name === 'AbortError') return;   // user dismissed picker
        // fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied');
    } catch {
      toast.error('Could not copy link');
    }
  }
  ```
  - Uses current `window.location.href` so the URL ALWAYS includes the active step (because step is in the URL by design — Steps 38 + 51).
  - `navigator.share` is the preferred path on iOS/Android/macOS Safari; clipboard for desktop browsers without share.
  - User-dismissed share picker (`AbortError`) is treated as a no-op (no error toast).
- **Acceptance:** On Chrome desktop → URL copied + toast; on iOS Safari → native share sheet opens.

### Step 59 — Grid mode `G` (thumbnails)
- **Goal:** The existing `/slides` index route IS Grid mode (Step 52); this step wires the shortcut + back-to-current-slide return.
- **Files:** `src/routes/slides.$slideId.tsx`, `src/routes/slides.$slideId.$step.tsx`, `src/routes/slides.index.tsx`.
- **Contract:**
  - From a slide route, `G` → `navigate({ to: '/slides' })`. (Already in keyboard handler.)
  - From `/slides` (grid), `G` or `Esc` → return to the LAST visited slide. Store `lastVisitedSlideId` in Zustand store (not localStorage; ephemeral):
    ```ts
    interface DeckState { lastVisitedSlideId?: string; setLastVisited(id: string): void; }
    ```
  - In grid `useEffect`: `useSlideKeyboard({ onGrid: returnToLast, onEscape: returnToLast })` where `returnToLast` navigates to `lastVisitedSlideId` or `slides[0].id`.
  - Single-slide route updates `lastVisitedSlideId` on mount/param change.
- **Acceptance:** From `/slides/process/3`, press `G` → grid; press `G` again → returns to `/slides/process/3` (NOT `/slides/process/1`); refresh wipes (intentional).

### Step 60 — Fullscreen Present mode `F5` + cursor-hide after 2 s
- **Goal:** Edge-to-edge slide rendering using the Fullscreen API with auto-hidden cursor and chrome for distraction-free presenting.
- **Files:** `src/components/slides/useFullscreen.ts` (existing, extend) + `src/routes/slides.tsx`.
- **Contract:**
  - `requestFullscreen` on `document.documentElement` (so root html element fills the screen, not just the slide div).
  - `F5` → enter; `Esc` → exit (Fullscreen API auto-handles Esc; explicit handler is a fallback).
  - Track `document.fullscreenElement` in state via `fullscreenchange` listener.
  - Cursor-hide hook on fullscreen ONLY:
    ```ts
    function useIdleCursor(active: boolean, timeoutMs = 2000) {
      useEffect(() => {
        if (!active) { document.body.style.cursor = ''; return; }
        let t: number; const show = () => { document.body.style.cursor = ''; clearTimeout(t); t = window.setTimeout(() => { document.body.style.cursor = 'none'; }, timeoutMs); };
        show();
        window.addEventListener('mousemove', show);
        return () => { window.removeEventListener('mousemove', show); clearTimeout(t); document.body.style.cursor = ''; };
      }, [active, timeoutMs]);
    }
    ```
  - ControlBar also hides while fullscreen + idle: same `active && idle` flag drives `opacity: 0; pointer-events: none`.
  - Cross-browser: include `webkitRequestFullscreen` / `msRequestFullscreen` fallbacks via the existing hook.
  - On `fullscreenchange` exit: restore cursor, restore ControlBar opacity, refocus the document body so keyboard scope still receives keys.
- **Acceptance:** `F5` enters fullscreen and slide fills screen; after 2 s idle cursor + ControlBar both disappear; any mouse move shows them; `Esc` exits cleanly and restores cursor.

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
