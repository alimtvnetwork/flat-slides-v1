# Slide Deck JSON — LLM Authoring Guideline

> **Audience:** LLMs (and humans) generating decks for this slide system.
> **Source of truth:** `src/lib/slides/schema.ts` (Zod) + `src/components/slides/types.ts` (TS).
> If this doc disagrees with those files, the code wins — open a PR to fix the doc.

A deck is a single JSON document validated by `DeckSchema`. It is imported via
File → Import (or paste) and rejected wholesale if any field is invalid. Stay
inside the schema; do not invent fields.

---

## Table of contents

1. [Deck root](#1-deck-root)
2. [DeckSettings](#2-decksettings)
3. [DeckMusic (optional)](#3-deckmusic-optional)
4. [BaseSlide — fields every slide has](#4-baseslide--fields-every-slide-has)
5. [RichText & Highlights](#5-richtext--highlights)
6. [TextPosition (9-cell grid)](#6-textposition-9-cell-grid)
7. [FocusRegion (camera zoom into a rect)](#7-focusregion-camera-zoom-into-a-rect)
8. [Hello-World deck](#8-hello-world-deck)
9. _(B2)_ Text-bearing slide types — `center`, `left`, `bullets`, `quote`, `steps`, `timeline`
10. _(B3)_ Media slides — `image`, `embed`, `poll`, `qa`
11. _(B4)_ Authoring patterns (highlights, multi-step SVG reveals, focus per step, theme/background overrides)
12. _(B5)_ Full sample deck, common mistakes, validation, version/migration

---

## 1. Deck root

```jsonc
{
  "id": "deck-2026-q1",            // [a-zA-Z0-9_-]{1,64}
  "title": "Q1 Review",            // 1..200 chars
  "themeId": "midnight",           // optional, see themes.ts
  "version": 1,                    // optional integer ≥ 1
  "slides": [ /* 1..200 Slide objects */ ],
  "settings": { /* DeckSettings — REQUIRED */ },
  "music":    { /* DeckMusic — optional */ }
}
```

Constraints (from `DeckSchema`):

| Field      | Required | Rule                                                  |
|------------|----------|-------------------------------------------------------|
| `id`       | yes      | URL-safe, 1–64 chars                                  |
| `title`    | yes      | 1–200 chars                                           |
| `themeId`  | no       | Up to 64 chars — must match a registered theme id     |
| `version`  | no       | Integer ≥ 1; bump when you change the JSON shape       |
| `slides`   | yes      | 1–200 slides                                          |
| `settings` | yes      | See §2                                                |
| `music`    | no       | See §3                                                |

---

## 2. DeckSettings

Controls the deck-wide background, transition, and audio. **All keys except
`backgroundImage` are required.**

```jsonc
{
  "backgroundMode": "color",        // "color" | "image"
  "backgroundColor": "#0b0b12",     // CSS color, 1..64 chars
  "backgroundImage": null,          // OR a URL / data: URI, ≤4096 chars
  "darken": 30,                     // 0..100  — image overlay opacity %
  "blur":   0,                      // 0..20   — image blur in px
  "transition": "fade",             // "fade" | "morph" | "camera-zoom" | "eaten"
  "soundEnabled": true,             // master mute (whoosh + click)
  "volume": 0.6                      // 0..1
}
```

**Defaults to use unless the deck calls for otherwise:**
- `transition: "fade"` — the user dislikes zoom on every slide. Reserve
  `"camera-zoom"` for hero/title moments via per-slide focus regions.
- `soundEnabled: true`, `volume: 0.6`.

---

## 3. DeckMusic (optional)

Presenter-local background music. Omit the whole key if not used.

```jsonc
"music": {
  "url": "https://cdn.example.com/loop.mp3",  // or data: URI, 1..4096 chars
  "loop": true,
  "volume": 0.25                              // 0..1
}
```

---

## 4. BaseSlide — fields every slide has

Every slide object (regardless of `type`) supports this base shape. **`id`,
`type`, and `title` are required.**

```jsonc
{
  "id": "intro",                    // URL-safe, 1..64 chars, UNIQUE per deck
  "type": "center",                 // discriminator — see §9–§10
  "title": "Welcome",               // 1..200 chars, used in tab title & grid
  "notes": "Speaker notes…",        // ≤4000 chars, presenter-only
  "background": "#111",             // per-slide CSS color OR image URL, ≤2048 chars
  "themeId": "noir",                // per-slide theme override
  "align": "center",                // see §6 — defaults vary by type
  "padding": 120,                   // 0..400 px in 1920×1080 space
  "enabled": true,                  // false ⇒ skipped from nav & totals
  "number": 7,                      // optional authored badge number 0..9999
  "budget": 45,                     // target dwell time in seconds (1..3600)
  "focus": [ /* FocusRegion[] — see §7 */ ]
}
```

Rules to follow:

- **`id` must be unique** within the deck. The schema is per-slide URL-safe;
  the importer rejects duplicates.
- **`title` is for chrome**, not the on-slide headline. Title-bearing slides
  expose `heading` / `quote` / `question` for the visible text.
- **`number` does NOT affect URLs.** URLs use 1-based linear position.
  Authored numbers only change the badge & grid chip.

---

## 5. RichText & Highlights

Most text fields that render at slide-scale (`heading`, `subhead`, `body`,
`bullets[i]`, `quote`, `steps[].detail`, `timeline.items[].detail`,
`image.caption`) accept **RichText**, not a plain string.

A `RichText` is a **non-empty array** of segments. Each segment is either:
- a plain string, or
- a `Highlight` object: `{ "text": "…", "pill": true }`.

```jsonc
// Plain text in RichText form — still must be an array
"heading": ["Hello, world"]

// Inline highlight (default: underlined accent color)
"heading": [
  "Revenue grew ",
  { "text": "3.4×" },
  " in 2025"
]

// Pill-style highlight (rounded accent chip)
"bullets": [
  ["Latency ", { "text": "<200ms", "pill": true }, " p99"],
  ["Uptime ", { "text": "99.99%", "pill": true }]
]
```

Constraints:

- Array must contain at least one segment.
- Every string segment must be non-blank after trimming.
- Every `Highlight.text` must be non-blank after trimming.
- Use `pill: true` sparingly — 1–2 per slide reads as emphasis; 6+ reads as noise.

---

## 6. TextPosition (9-cell grid)

`align` places the body block inside the 1920×1080 canvas:

```
top-left      top-center      top-right
center-left   center          center-right
bottom-left   bottom-center   bottom-right
```

Typical choices:

- `center` — title slides, quotes.
- `center-left` — text-with-media (`left`-type slides).
- `top-left` — bullets/steps with headline anchored top.
- `bottom-left` — image-as-cover with caption overlay.

---

## 7. FocusRegion (camera zoom into a rect)

`slide.focus` is an array (≤16) of rectangles in 1920×1080 slide space. The
camera animates so each rect fills the viewport (aspect preserved). When
`step` is set the region binds to that 1-based sub-step; otherwise it applies
on every step. **Step-bound regions win over unbound ones.**

```jsonc
"focus": [
  // Always-on focus for this slide
  { "x": 280, "y": 200, "w": 1360, "h": 680, "label": "Hero block" },

  // Step-specific focus (advance with → on a `steps` or `timeline` slide)
  { "step": 1, "x":  120, "y": 600, "w": 760, "h": 360, "label": "Discover", "duration": 700 },
  { "step": 2, "x":  580, "y": 600, "w": 760, "h": 360, "label": "Design" },
  { "step": 3, "x": 1040, "y": 600, "w": 760, "h": 360, "label": "Deliver" }
]
```

Bounds (schema): `x` ∈ [-1920,1920], `y` ∈ [-1080,1080], `w` ∈ [1,3840],
`h` ∈ [1,2160], `duration` ∈ [0,5000] ms (default ~700), `label` ≤ 80 chars.

**When to use:** product screenshots where you walk the audience through
sections, step-by-step process slides, before/after reveals. **When not:**
plain text slides — the user has explicitly asked that lists and timelines
never scale or zoom.

---

## 8. Hello-World deck

The smallest valid deck — paste this into File → Import and it imports cleanly.

```json
{
  "id": "hello-deck",
  "title": "Hello, deck",
  "version": 1,
  "settings": {
    "backgroundMode": "color",
    "backgroundColor": "#0b0b12",
    "darken": 0,
    "blur": 0,
    "transition": "fade",
    "soundEnabled": true,
    "volume": 0.6
  },
  "slides": [
    {
      "id": "title",
      "type": "center",
      "title": "Hello",
      "heading": ["Hello, ", { "text": "world", "pill": true }],
      "subhead": ["A minimal one-slide deck."]
    }
  ]
}
```

---

## Continued in batches

- **B2 (steps 11–20):** All text-bearing slide types — every field, every example.
- **B3 (steps 21–30):** Media slides (`image`, `embed`, `poll`, `qa`) including
  URL / base64 / inline-SVG image patterns and multi-step SVG reveals.
- **B4 (steps 31–40):** Authoring patterns and density rules.
- **B5 (steps 41–50):** Full `sample-deck.json`, validation, common mistakes,
  versioning.
