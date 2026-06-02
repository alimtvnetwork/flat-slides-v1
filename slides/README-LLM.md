# Glasswing Slide JSON — LLM Authoring Guide

This document is the **complete, self-contained spec** for the JSON format used
by the Glasswing slide system. Feed it to any LLM (GPT, Claude, Gemini, Llama…)
and ask it to write a deck — the output should drop straight into the app via
**Settings → Import deck**.

> **Golden rule:** Output **valid JSON only**. No prose, no markdown, no
> comments — just a single JSON object.

---

## 1. File layout

There are two file shapes:

| File              | Contains              | Imported via               |
|-------------------|-----------------------|----------------------------|
| `*.deck.json`     | A whole deck          | Settings → **Import deck** |
| `*.slide.json`    | One slide             | Settings → **Import slide** |

A deck file looks like:

```json
{
  "id": "my-deck",
  "title": "My Deck",
  "themeId": "midnight",
  "version": 2,
  "settings": { /* see §4 */ },
  "slides":   [ /* see §5 */ ]
}
```

A single-slide file is exactly **one** of the slide objects from `slides[]`.

---

## 2. Identifiers and constraints

- `id` (deck or slide): `^[a-zA-Z0-9_-]+$`, 1–64 chars. Must be unique within a deck.
- `title`: human label, 1–200 chars.
- `notes`: optional presenter notes, ≤ 4000 chars.
- All URLs (`background`, image `src`) must be `http(s)://…` or `data:image/…;base64,…`.

The schema is enforced by Zod (`src/lib/slides/schema.ts`). Invalid imports show
the first 4 errors in a toast — fix and retry.

---

## 3. Themes

Three built-in themes ship in `src/components/slides/themes.ts`:

| `themeId`   | Background | Text   | Highlight |
|-------------|------------|--------|-----------|
| `midnight`  | `#101010`  | warm   | yellow    |
| `paper`     | `#f5f0e6`  | black  | blue      |
| `sunset`    | `#1b0d1f`  | rose   | coral     |

Set `deck.themeId` to apply globally. Override on any individual slide with
`slide.themeId`.

---

## 4. Deck settings (`settings`)

```json
{
  "backgroundMode":  "color",          // "color" | "image"
  "backgroundColor": "#101010",         // any CSS color
  "backgroundImage": "https://...",     // optional, used when mode = "image"
  "darken":          0,                 // 0–100, overlay strength
  "blur":            0,                 // 0–20, px
  "transition":      "fade",            // "fade" default; "camera-zoom" only for rare hero/title moments
  "soundEnabled":    true,
  "volume":          0.6                // 0–1
}
```

---

## 5. Slide types

Every slide has these **common fields** (in addition to type-specific ones):

```jsonc
{
  "id":         "intro",                 // url-safe, unique
  "type":       "center",                // see types below
  "title":      "Introduction",          // tab + grid label
  "notes":      "...",                   // optional presenter notes
  "background": "#000" | "https://...",  // optional; overrides settings
  "themeId":    "paper",                  // optional per-slide theme
  "align":      "center",                 // see §6 (text positioning)
  "padding":    120                       // optional, 0–400 (1920×1080 px)
}
```

### 5.1 `type: "center"` — headline + optional subhead
```json
{
  "id": "title", "type": "center", "title": "Hello",
  "heading":  ["Hello\nworld"],
  "subhead":  [{ "text": "again", "pill": true }],
  "display":  true,
  "align":    "center"
}
```

### 5.2 `type: "left"` — kicker + heading + body, optional media
```json
{
  "id": "intro", "type": "left", "title": "Intro",
  "kicker": "Chapter 1",
  "heading": ["The ", { "text": "story" }, " so far"],
  "body":    ["A short paragraph with a ", { "text": "highlight" }, "."],
  "media":   { "src": "https://...", "alt": "Diagram" }
}
```

### 5.3 `type: "steps"` — named focused steps (1–8 items)
```json
{
  "id": "process", "type": "steps", "title": "Process",
  "heading": "How it works",
  "steps": [
    { "label": "Step 1", "title": "Listen", "detail": ["Listen to the ", { "text": "user" }] },
    { "label": "Step 2", "title": "Shape",  "detail": ["Sketch the ", { "text": "shape" }] },
    { "label": "Step 3", "title": "Ship",   "detail": ["Ship and ", { "text": "iterate" }] }
  ]
}
```

All step labels and titles remain visible. Arrow navigation changes the focused
step and cross-fades only the centered label/title/detail; non-focused steps
stay readable but muted/grey, never hidden. The focused label and title render
as separate lines so long names do not clip.
Legacy rich-text arrays are still accepted on import and become `{ "label":
"Step N", "detail": [...] }` automatically.

### 5.4 `type: "timeline"` — rail + focused pinpoints (2–8 items)
```json
{
  "id": "roadmap", "type": "timeline", "title": "Roadmap",
  "heading": "Roadmap",
  "items": [
    { "label": "Q1", "title": "Discovery", "detail": ["Interview ", { "text": "20 customers" }] },
    { "label": "Q2", "title": "Prototype", "detail": ["Validate the ", { "text": "core flow" }] },
    { "label": "Q3", "title": "Beta", "detail": ["Ship to ", { "text": "design partners" }] }
  ]
}
```

Timeline items render as pinpoints on a rail. The focused item is highlighted,
completed/other pinpoints stay visible in muted/grey states, and the centered
label/title/detail fades between items without zooming the slide. Keep the
focused label and title as separate lines; do not concatenate them into one
oversized heading.

### 5.5 `type: "quote"` — pull quote with attribution
```json
{
  "id": "epigraph", "type": "quote", "title": "Quote",
  "quote":       ["Make it ", { "text": "obvious" }, "."],
  "attribution": "— Steve Krug"
}
```

### 5.6 `type: "bullets"` — heading + bullet list (1–8 items)
```json
{
  "id": "why", "type": "bullets", "title": "Why",
  "kicker":  "Why",
  "heading": ["Why ", { "text": "JSON" }, "-first?"],
  "align":   "top-left",
  "bullets": [
    ["Author with any ", { "text": "LLM" }],
    ["Version-control like code"],
    ["Import or export ", { "text": "single slides" }]
  ]
}
```

### 5.7 `type: "image"` — full-bleed or split image
```json
{
  "id": "cover", "type": "image", "title": "Cover",
  "src":     "https://images.example.com/cover.jpg",
  "alt":     "City at dawn",
  "fit":     "cover",                       // "cover" | "contain" | "split"
  "heading": ["When ", { "text": "split" }],// shown only when fit = "split"
  "caption": ["Photo by ", { "text": "you" }]
}
```

---

## 6. Text positioning (`align`)

Pick one of nine cells:

```
top-left      top-center      top-right
center-left   center          center-right
bottom-left   bottom-center   bottom-right
```

Default per type: `center` for `center`/`quote`, `center-left` for `bullets`,
left-justified for `left`.

Combine with `padding` (px in the 1920×1080 canvas) to fine-tune breathing room.

---

## 7. Rich text — strings + highlight chips

Every text field that takes "Rich" content (heading, body, bullets, quote,
step detail, subhead, caption) is an **array** of:

- `"plain string"` — `\n` becomes a line break
- `{ "text": "…" }` — inline highlight (`.hl` class, theme accent color)
- `{ "text": "…", "pill": true }` — solid pill chip (e.g. "Think" badge)

Example:

```json
[
  "Don't make me ",
  { "text": "Think", "pill": true },
  "."
]
```

---

## 8. Density and readability rules

Generated decks **must** respect:

- ≤ 8 bullets / steps per slide
- ≤ 200 char body paragraphs
- One main idea per slide → split into multiple slides if longer
- Body text renders at 32 px (projected); avoid <4-word fragments at body size
- Use `pill: true` sparingly — at most one per slide for emphasis

---

## 9. Minimal complete example

```json
{
  "id": "demo",
  "title": "Demo Deck",
  "themeId": "midnight",
  "version": 2,
  "settings": {
    "backgroundMode":  "color",
    "backgroundColor": "#101010",
    "darken": 0, "blur": 0,
    "transition": "fade",
    "soundEnabled": true, "volume": 0.6
  },
  "slides": [
    {
      "id": "cover", "type": "center", "title": "Cover",
      "display": true, "align": "center",
      "heading": ["Glasswing"]
    },
    {
      "id": "why", "type": "bullets", "title": "Why",
      "heading": ["Why ", { "text": "JSON" }, "?"],
      "align": "center-left",
      "bullets": [
        ["Any ", { "text": "LLM" }, " can author a deck"],
        ["Diff-friendly under git"],
        ["Export or import ", { "text": "single slides" }]
      ]
    },
    {
      "id": "outro", "type": "quote", "title": "Outro",
      "quote": ["Animation is the ", { "text": "priority" }, "."],
      "attribution": "— Project brief"
    }
  ]
}
```

---

## 10. Prompt template for an LLM

Paste this prompt to generate a deck:

> You are a deck author. Output **only** a single JSON object matching the
> Glasswing deck schema below. No markdown, no commentary. Constraints:
> 6–12 slides, mix of `center`, `bullets`, `steps`, `timeline`, `quote`. Use the
> `midnight` theme. Highlight one keyword per slide with `{"text":"…"}`.
> Topic: **<YOUR TOPIC>**.
>
> Schema reference: <paste sections 4–7 of this file>
