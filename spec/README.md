# Slide Presentation Engine — Spec

> Status: SPEC ONLY. No implementation in this phase. Build only begins
> after the user types `next`. Animation is the #1 priority of this engine.

---

## 1. Sample Thumbnails

The reference thumbnails the user provided live next to this file and are
also mirrored in `/assets/samples/` so they can be used as live background
sources by the runtime.

| # | File | Mirror in assets |
| - | ---- | ---------------- |
| 01 | `spec/01-sample.webp` | `assets/samples/01-sample.webp` |
| 02 | `spec/02-sample.webp` | `assets/samples/02-sample.webp` |
| 03 | `spec/03-sample.jpg`  | `assets/samples/03-sample.jpg`  |

### 1.1 `01-sample.webp` — "Project Glasswing"

- **Format:** 16:9 thumbnail, flat color.
- **Background:** Solid near-black charcoal (`#101010` approx). Completely
  flat, no gradient, no noise, no vignette.
- **Foreground:** Two-line wordmark "Project / Glasswing" centered both
  horizontally and vertically. Color is a warm off-white / bone
  (`#F4EFE4` approx). Typeface is a high-contrast transitional serif
  (display-weight, bracketed serifs, generous x-height) — closest match
  in our stack will be a serif display face (e.g. Instrument Serif /
  DM Serif Display) at ~220–260px on a 1920×1080 canvas.
- **Sections:** single centered text block, ~50% of canvas height,
  60–70% of canvas width. No chrome, no footer, no page counter.
- **Slide type this maps to:** **Center Text Slide** (Type B).

### 1.2 `02-sample.webp` — "Don't make me Think"

- **Background:** Pure black (`#000000`).
- **Top text:** "Don't make me" — sans-serif, semi-bold, pure white,
  centered, ~96–110px on a 1920×1080 canvas.
- **Highlight chip:** Large rounded-rectangle pill (radius ~28–36px)
  filled with a saturated yellow (`#FFD83A` approx). Inside the pill,
  the word **"Think"** in heavy/black-weight sans-serif, pure black,
  ~180–210px. The pill has generous internal padding (≈ 0.9× font
  size horizontal, 0.35× font size vertical) and a subtle outer
  drop-shadow.
- **Cursor mark:** A white "pointer hand" cursor icon with a black
  outline sits at the bottom-right of the pill, overlapping it, as
  if the user is clicking the highlight.
- **Sections:** vertical stack — line 1 (lead text), line 2
  (highlight pill + cursor). Symmetric horizontal centering.
- **Slide type this maps to:** **Center Text Slide with Highlight**
  (Type B variant) — proves the "highlighted text in yellow with
  text/box shadow + bold" rule.

### 1.3 `03-sample.jpg` — "Sajida Proposal"

- **Background:** Dark charcoal canvas dressed as a fake desktop app
  window. Top chrome shows a fake browser/notes tab "Untitled",
  File/Edit/View menu, and a formatting toolbar (H1, list, B, I, S,
  link, table). Bottom chrome shows a black bar with two brand
  lockups: **RiseupAsia** on the left and **RiseupPro** on the
  right (white + yellow accent).
- **Left section (≈ 45% width):** Heading "Sajida / Proposal" stacked
  on two lines, left-aligned, soft off-white. Sans-serif geometric
  (Poppins / similar), light weight, ~120–140px.
- **Right section (≈ 55% width):** Squircle/superellipse-cropped
  photo of a presenter (talking-head shot) with a thin warm-orange
  rim/glow on the lower-left edge. Drop-shadow under the squircle.
- **Sections:** classic two-column "left text / right media".
- **Slide type this maps to:** **Left Slide** (Type A) with media
  on the right and full app-chrome dressing.

---

## 2. Slide Types

The engine supports **4 slide types** (with a 5th reserved for future).

### Type A — Left Slide (text-left, media-right)
- Left column: heading (Ubuntu) + short description (Poppins). The
  description may contain `<mark>` runs that render in the highlight
  style (see §4).
- Right column: image, video, illustration, or empty.
- Reference: `03-sample.jpg`.

### Type B — Center Text Slide
- Centered headline (Ubuntu or serif display) + optional one-liner
  description (Poppins) below.
- Supports inline highlight chips (yellow pill with shadow) for any
  bold/marked word.
- References: `01-sample.webp`, `02-sample.webp`.

### Type C — Step-by-Step Slide
- A single slide carries up to **5 ordered steps**.
- Each press of `Enter` / `→` reveals the next step with the
  configured **reveal animation** (default: camera-zoom-in + whoosh).
- `←` reverses one step. After the last step, `→` advances to the
  next slide.
- Each step has its own URL coordinate (see §8).

### Type D — Quote / Statement Slide
- Single large quoted line, attribution underneath, optional avatar.
- Same highlight rules as Type B.

### Type E (reserved) — Media-Full Slide
- Edge-to-edge image/video background with optional caption strip.
  Reserved for a later phase.

---

## 3. Typography

| Role | Font | Notes |
| ---- | ---- | ----- |
| Headings | **Ubuntu** | 88–140px on 1920×1080. |
| Body / description | **Poppins** | 28–40px. |
| Highlight runs | Poppins **Bold** | wrapped in `<mark class="hl">`. |
| Chrome (page #, footer) | Poppins | 20–22px. |

Render at fixed 1920×1080 and scale via `transform: scale(...)` per the
slides-app convention.

---

## 4. Highlighted Text Rule

Any text wrapped in `<mark class="hl">` or `**bold**` shorthand renders
with:

- Color: **yellow** (`#FFD83A`, token `--slide-hl`).
- Weight: **bold / 700**.
- Effect: **text-shadow** (default), with an optional **box-shadow**
  variant when wrapped as a pill.

Reference CSS to keep in the spec (canonical example — the user will
supply the final values; this is the starting point):

```css
/* Inline yellow highlight with soft glow */
.hl {
  color: #FFD83A;
  font-weight: 700;
  text-shadow:
    0 0 1px rgba(0, 0, 0, 0.35),
    0 2px 0 rgba(0, 0, 0, 0.25),
    0 0 18px rgba(255, 216, 58, 0.35);
}

/* Pill variant (Type B "Think" chip) */
.hl-pill {
  display: inline-block;
  padding: 0.35em 0.9em;
  background: #FFD83A;
  color: #0A0A0A;
  font-weight: 900;
  border-radius: 0.28em;
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.35),
    0 2px 0 rgba(0, 0, 0, 0.4);
}
```

---

## 5. Animations (TOP PRIORITY)

### 5.1 Camera Zoom (signature transition)
- **Not** a CSS `scale()` zoom on the slide. The feeling must be a
  physical camera dollying *into* the scene from an overhead pull-back.
- Technique: render the current scene inside a 3D-perspective stage
  (`perspective: 2400px`), then animate the camera by interpolating
  `translateZ` from a negative pull-back (e.g. `-600px`) to `0` while
  simultaneously easing `translateY` and a tiny `rotateX` toward
  neutral. Pair with a brief motion-blur (CSS `filter: blur()` ramp 0
  → 4px → 0) and a depth-of-field crossfade on the outgoing layer.
- **Sound:** trigger `assets/audio/whoosh.mp3` (to be added) on
  transition start. Sound is mutable from the settings panel and
  obeys the global `prefers-reduced-motion` check (silent + fade
  fallback when reduced motion is on).

### 5.2 Morph Transition
- Outgoing and incoming slides cross-fade while shared elements
  (same `layoutId`) interpolate position/size — FLIP-style morph.

### 5.3 Fade-In
- Plain opacity fade with a 12px upward translate. Default when no
  other transition is chosen.

### 5.4 "Eaten Text" Transition
- Outgoing text appears to be consumed: per-character mask wipes
  left-to-right with a slight scale-down + blur, immediately followed
  by the next slide **popping in** (scale 1.06 → 1.0, opacity 0 → 1,
  120ms). Optional crunch SFX hook (off by default).

### 5.5 Per-element entrance
- Steps in Type C reveal with the camera-zoom by default; per-step
  override allowed (`fade`, `morph`, `eaten`).

### 5.6 Reduced-motion fallback
- When `prefers-reduced-motion: reduce`, all signature animations
  degrade to a 150ms fade and audio is suppressed.

---

## 6. Backgrounds & Settings

- **Two background modes:**
  1. **Solid color** (default `--slide-bg`).
  2. **Image** sourced from `/assets/samples/*` or a user upload, with
     a configurable darken/blur overlay.
- **Background color** is user-editable via a color picker in the
  settings drawer.
- **Settings drawer** lives behind a gear icon in the control bar and
  contains:
  - Background mode toggle (color / image).
  - Color picker.
  - Image picker (gallery of `/assets/samples/*`).
  - Sliders: image darken (0–100%), image blur (0–20px).
  - Transition selector (`camera-zoom`, `morph`, `fade`, `eaten`).
  - Sound toggle (whoosh on/off) + volume slider.

---

## 7. Export

Three export targets, all reachable from the control bar `Export ▾`
menu:

1. **PDF** — one slide per page at 1920×1080, landscape, via the
   `?print` route + `Cmd+P` pattern documented in the slides skill.
2. **HTML** — self-contained static bundle (single `index.html`,
   inlined CSS, lazy-loaded slide chunks). Opens in any browser.
3. **GIF** — animated GIF of the whole deck (or selected slide), one
   frame per ~80ms, recorded by walking the deck with the chosen
   transition. Resolution is selectable (720p / 1080p).

---

## 8. Navigation, URL, Sharing

- Each slide is its own page: `/slides/$slideId` (and
  `/slides/$slideId/$step` for Type C step coordinates).
- Control bar buttons: ◀ Prev · `N / Total` · ▶ Next · 🔗 Share ·
  ⤓ Export · ⚙ Settings.
- **Share button** copies the current absolute URL (slide + step)
  to the clipboard and shows a toast. On platforms with
  `navigator.share`, opens the native share sheet.
- **Slide-number jump:** double-clicking the `N` in `N / Total`
  turns it into an editable input; pressing `Enter` navigates to
  that slide. `Esc` cancels.
- Keyboard: `→`/`Space`/`Enter` next, `←` prev, `G` grid, `F5`
  present, `Esc` exit present.

---

## 9. File-System Layout (planned)

```
/spec/                  this spec + thumbnails
/assets/samples/        mirrored thumbnails used as backgrounds
/assets/audio/          whoosh.mp3 (to be added)
/.lovable/todo-tasks.md task plan (20 overview + 100 detailed steps)
```

---

## 10. Open Questions

1. Final yellow hex — user mentioned "yellowish", default assumed
   `#FFD83A`. Confirm or override.
2. Whoosh SFX source — does the user provide one or should we pick a
   royalty-free clip?
3. GIF export size cap — what's the acceptable max file size?
4. Type E (media-full) — in or out of v1?
