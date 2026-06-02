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
