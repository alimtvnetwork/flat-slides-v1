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

## 9. Text-bearing slide types

All examples below are **complete slide objects** — drop them into `slides: [...]`.
Required fields are marked ✱.

### 9.1 `center` — title / hero

Use for opening slides, section dividers, single-statement reveals. The
`display: true` flag bumps the heading to `slide-title-lg` (104px) — reserve
it for the deck cover.

| Field      | Type        | Required | Notes |
|------------|-------------|----------|-------|
| `type`     | `"center"`  | ✱        | discriminator |
| `heading`  | RichText    | ✱        | the headline (88–104px) |
| `subhead`  | RichText    |          | one short supporting line (52px) |
| `display`  | boolean     |          | `true` ⇒ use the largest title size |
| `align`    | TextPosition|          | defaults to `"center"` |

```jsonc
{
  "id": "cover",
  "type": "center",
  "title": "Cover",
  "display": true,
  "heading": ["The ", { "text": "Quiet", "pill": true }, " Revolution"],
  "subhead": ["How small teams shipped large software in 2025."]
}
```

### 9.2 `left` — text + media (50/50 split)

Headline + supporting copy on the left; image (or React node) on the right.

| Field     | Type                                              | Required | Notes |
|-----------|---------------------------------------------------|----------|-------|
| `type`    | `"left"`                                          | ✱        ||
| `kicker`  | string ≤80                                        |          | small UPPERCASE eyebrow |
| `heading` | RichText                                          | ✱        | 88px |
| `body`    | RichText                                          |          | one paragraph, 2–4 lines |
| `media`   | `{ src: url-or-data:, alt?: string }`             |          | URL or `data:` URI |

```jsonc
{
  "id": "product",
  "type": "left",
  "title": "Product",
  "kicker": "Why now",
  "heading": ["Speed is the ", { "text": "feature" }],
  "body": [
    "Every team we shipped to in Q4 told us the same thing: ",
    "the app feels alive. We doubled down on perceived latency."
  ],
  "media": {
    "src": "https://images.example.com/product-hero.jpg",
    "alt": "Product dashboard"
  }
}
```

### 9.3 `bullets` — headline + 1..8 bullets

| Field     | Type        | Required | Notes |
|-----------|-------------|----------|-------|
| `type`    | `"bullets"` | ✱        ||
| `kicker`  | string ≤80  |          | optional eyebrow |
| `heading` | RichText    | ✱        ||
| `bullets` | RichText[]  | ✱        | 1..8 items; each is its own RichText array |

```jsonc
{
  "id": "highlights",
  "type": "bullets",
  "title": "Q4 highlights",
  "kicker": "Q4 2025",
  "heading": ["Four numbers that ", { "text": "mattered" }],
  "bullets": [
    ["Revenue ", { "text": "+34%", "pill": true }, " YoY"],
    ["Active teams crossed ", { "text": "10,000" }],
    ["p99 latency ", { "text": "<180ms", "pill": true }],
    ["Net retention ", { "text": "127%" }]
  ]
}
```

Density: keep each bullet ≤ ~60 chars. If you have 6+ bullets, split the slide.

### 9.4 `quote` — pull-quote

| Field         | Type     | Required | Notes |
|---------------|----------|----------|-------|
| `type`        | `"quote"`| ✱        ||
| `quote`       | RichText | ✱        ||
| `attribution` | string ≤200 |       | "— Name, Role" |

```jsonc
{
  "id": "voice",
  "type": "quote",
  "title": "Customer quote",
  "quote": [
    "It is the first tool our designers ",
    { "text": "asked to keep" },
    " after the trial ended."
  ],
  "attribution": "— Priya N., Head of Design, Northwind"
}
```

### 9.5 `steps` — step-by-step with sub-step navigation

Step-aware: each entry in `steps` consumes one sub-step in the
`/slides/N/S` URL. → on the last step advances to the next slide.

A step is either:
- a `RichText` array (shorthand — the label becomes `Step N`), or
- a full object: `{ label, title?, detail }`.

| Field      | Type    | Required | Notes |
|------------|---------|----------|-------|
| `type`     | `"steps"`| ✱       ||
| `heading`  | string 1..200 | ✱  | plain string, NOT RichText |
| `steps`    | StepItem[]    | ✱  | 1..8 |

StepItem fields:

| Field    | Type     | Required | Notes |
|----------|----------|----------|-------|
| `label`  | string 1..80 | ✱    | short tag in the persistent list |
| `title`  | string ≤120 |       | focus heading shown when active |
| `detail` | RichText  | ✱       | fades in when this step activates |

```jsonc
{
  "id": "process",
  "type": "steps",
  "title": "How we ship",
  "heading": "Three phases, one week each",
  "steps": [
    {
      "label": "Discover",
      "title": "Talk to 5 users",
      "detail": ["Interview five real users. Write findings within ", { "text": "24h" }, "."]
    },
    {
      "label": "Design",
      "title": "Prototype the riskiest screen first",
      "detail": ["Build the one screen that could kill the project. Skip the rest."]
    },
    {
      "label": "Deliver",
      "title": "Ship behind a flag on Friday",
      "detail": ["Default-off flag. Internal users only. Watch logs for 48h."]
    }
  ]
}
```

Pair with per-step `focus` regions (§7) when you want the camera to land
on a corresponding diagram chunk per step.

### 9.6 `timeline` — chronological rail with 2..8 pinpoints

Step-aware like `steps`. Renders as a horizontal rail with pinpoints; the
centred detail block fades between items. **Lists/timelines must never
zoom** — keep `transition` at `fade` and use focus regions only on the
companion image slide, not on the timeline itself.

| Field     | Type        | Required | Notes |
|-----------|-------------|----------|-------|
| `type`    | `"timeline"`| ✱        ||
| `heading` | string ≤200 |          | optional rail title |
| `items`   | TimelineItem[] | ✱     | 2..8 |

TimelineItem:

| Field    | Type    | Required | Notes |
|----------|---------|----------|-------|
| `label`  | string 1..80 | ✱   | small tag under the pinpoint (Q1, 2024…) |
| `title`  | string ≤120  |     | bold focus heading |
| `detail` | RichText     |     | centred paragraph when focused |

```jsonc
{
  "id": "roadmap",
  "type": "timeline",
  "title": "2026 roadmap",
  "heading": "What ships, when",
  "items": [
    { "label": "Q1", "title": "Public API",      "detail": ["Read endpoints, OAuth, SDKs in TS + Python."] },
    { "label": "Q2", "title": "Workspaces",      "detail": ["Multi-team isolation with shared billing."] },
    { "label": "Q3", "title": "Audit log",       "detail": ["SOC2-friendly export to S3 / GCS."] },
    { "label": "Q4", "title": "Mobile",          "detail": ["iPad presenter app + iOS audience view."] }
  ]
}
```

For the full timeline rendering contract see
[`docs/slides/timeline-slide.spec.md`](../timeline-slide.spec.md).

---

## 10. Media slides

### 10.1 `image` — full-bleed, letterbox, or split

The `src` MUST be either an `https://` URL or a `data:` URI. Both are
validated by the importer.

| Field     | Type                              | Required | Notes |
|-----------|-----------------------------------|----------|-------|
| `type`    | `"image"`                         | ✱        ||
| `src`     | url \| `data:` URI                | ✱        | the image |
| `alt`     | string ≤200                       |          | screen-reader text |
| `caption` | RichText                          |          | rendered under/over the image |
| `heading` | RichText                          |          | optional headline above the image (split mode) |
| `fit`     | `"cover" \| "contain" \| "split"` |          | default `"cover"` |

`fit` modes:

- **`cover`** — image fills the full 1920×1080 canvas, cropped to fit. Good
  for hero photos. Pair with a short `caption` overlay.
- **`contain`** — image is letterboxed inside the canvas. Use for screenshots,
  diagrams, or anything that must not be cropped.
- **`split`** — image on one half, `heading` + `caption` on the other.
  Use when the audience needs to read text and see the image at the same time.

#### 10.1.1 Image from a URL

```jsonc
{
  "id": "hero-photo",
  "type": "image",
  "title": "Office on launch day",
  "src": "https://images.example.com/launch-day.jpg",
  "alt": "Team photo on launch morning",
  "fit": "cover",
  "caption": ["Launch morning, ", { "text": "Mar 14 2026" }]
}
```

#### 10.1.2 Image as base64 (`data:` URI)

Use for tiny inline icons, logos, or one-off snapshots that you do not want
to host. **Keep base64 payloads small** — anything over a few hundred KB
bloats the deck JSON and slows imports. For real photos, use a URL.

Format: `data:<mime>;base64,<payload>` — exactly the format `<img src="…">`
accepts. The schema accepts any string that **starts with `data:`** (no
length cap is enforced beyond the JSON document size, but be reasonable).

```jsonc
{
  "id": "logo-mark",
  "type": "image",
  "title": "Logo",
  "fit": "contain",
  "alt": "Acme logomark",
  "src": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=="
}
```

#### 10.1.3 SVG as a `data:` URI (preferred for SVG)

SVG must be wrapped as a data URI to fit the `src` field. Two options:

- **`data:image/svg+xml;utf8,` + URL-encoded XML** — human-readable, smaller
  for short SVGs. Encode `#` as `%23`, `<` as `%3C`, `>` as `%3E`, etc.
- **`data:image/svg+xml;base64,` + base64** — opaque but binary-safe;
  required if the SVG contains characters that are awkward to URL-encode.

```jsonc
{
  "id": "diagram-svg",
  "type": "image",
  "title": "System diagram",
  "fit": "contain",
  "alt": "Three-tier system: client → API → DB",
  "src": "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D'http%3A//www.w3.org/2000/svg'%20viewBox%3D'0%200%20480%20120'%3E%3Crect%20x%3D'10'%20y%3D'30'%20width%3D'120'%20height%3D'60'%20rx%3D'10'%20fill%3D'%231d4ed8'/%3E%3Crect%20x%3D'180'%20y%3D'30'%20width%3D'120'%20height%3D'60'%20rx%3D'10'%20fill%3D'%2316a34a'/%3E%3Crect%20x%3D'350'%20y%3D'30'%20width%3D'120'%20height%3D'60'%20rx%3D'10'%20fill%3D'%23db2777'/%3E%3Cline%20x1%3D'130'%20y1%3D'60'%20x2%3D'180'%20y2%3D'60'%20stroke%3D'white'%20stroke-width%3D'4'/%3E%3Cline%20x1%3D'300'%20y1%3D'60'%20x2%3D'350'%20y2%3D'60'%20stroke%3D'white'%20stroke-width%3D'4'/%3E%3C/svg%3E"
}
```

#### 10.1.4 Multi-step SVG reveals (the "build" pattern)

The `image` slide itself has no `steps` array. To reveal an SVG in stages,
use one of the two patterns below.

**Pattern A — single big SVG + per-step `focus` regions (preferred).**
Author one SVG that contains the whole diagram, then use `slide.focus` to
zoom the camera onto each chunk per step. The user advances with →; the
SVG never changes, only the framing does. This is the only way to keep all
labels and connectors visible to the audience.

The slide needs sub-steps for the URL contract to register them. Today only
`steps` and `timeline` are step-aware (see `slideStepCount`). The cleanest
authoring shape is therefore a `steps` slide whose `detail` text describes
what to look at, paired with a sibling `image` slide that owns the SVG —
**OR** put the SVG diagram as the slide `background` and use a `steps` slide
with matching per-step focus regions:

```jsonc
{
  "id": "arch-build",
  "type": "steps",
  "title": "Architecture, in three reveals",
  "background": "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D'http%3A//www.w3.org/2000/svg'%20viewBox%3D'0%200%201920%201080'%3E%3C!--%20full%20diagram%20here%20--%3E%3C/svg%3E",
  "heading": "From request to response",
  "steps": [
    { "label": "Client",  "title": "What the user sees", "detail": ["The browser sends a single ", { "text": "GET /deck" }, " on load."] },
    { "label": "Edge",    "title": "Cached & validated", "detail": ["The edge serves a stale copy in <20ms, revalidates in the background."] },
    { "label": "Origin",  "title": "Render & persist",  "detail": ["Origin renders the deck JSON, writes the new revision to storage."] }
  ],
  "focus": [
    { "step": 1, "x":   60, "y":  80, "w": 600, "h": 920, "label": "Client column" },
    { "step": 2, "x":  660, "y":  80, "w": 600, "h": 920, "label": "Edge column"   },
    { "step": 3, "x": 1260, "y":  80, "w": 600, "h": 920, "label": "Origin column" }
  ]
}
```

**Pattern B — N consecutive `image` slides, each a more-complete SVG.**
Author the SVG once with every layer, then export N variants where each
later variant has more `<g>` groups visible (or use `opacity="0"` on the
hidden ones). Each variant is its own `image` slide; → advances between
them. Use this when the SVG itself must change between steps (a node
appearing, a number updating, an arrow being drawn) rather than just the
framing. Keep all slides at the same `fit`, `align`, and `background` so
the only visible change is the SVG itself; that reads as a single animated
reveal rather than separate slides.

```jsonc
// Slide 1 — only the client node visible
{ "id": "arch-1", "type": "image", "title": "Architecture (1/3)", "fit": "contain",
  "src": "data:image/svg+xml;utf8,..." },
// Slide 2 — client + edge
{ "id": "arch-2", "type": "image", "title": "Architecture (2/3)", "fit": "contain",
  "src": "data:image/svg+xml;utf8,..." },
// Slide 3 — full diagram
{ "id": "arch-3", "type": "image", "title": "Architecture (3/3)", "fit": "contain",
  "src": "data:image/svg+xml;utf8,..." }
```

### 10.2 `embed` — iframe (https only)

| Field     | Type        | Required | Notes |
|-----------|-------------|----------|-------|
| `type`    | `"embed"`   | ✱        ||
| `url`     | https URL   | ✱        | must start with `https://` |
| `heading` | string ≤200 |          | text above the iframe |
| `caption` | string ≤400 |          | text below the iframe |
| `allow`   | string ≤200 |          | iframe `allow` attribute (default `"fullscreen"`) |

```jsonc
{
  "id": "demo",
  "type": "embed",
  "title": "Live demo",
  "heading": "Try it yourself",
  "url": "https://demo.example.com/playground",
  "allow": "fullscreen; clipboard-read; clipboard-write",
  "caption": "Tab into the input to focus. Esc returns to the deck."
}
```

`http://` URLs are rejected by the schema. Sites that block framing
(`X-Frame-Options: DENY`) will render as a blank area — test before
shipping.

### 10.3 `poll` — live audience poll

| Field      | Type       | Required | Notes |
|------------|------------|----------|-------|
| `type`     | `"poll"`   | ✱        ||
| `question` | string 1..280 | ✱     | plain string (no RichText) |
| `options`  | string[]   | ✱        | 2..8 options, each 1..120 chars |

```jsonc
{
  "id": "poll-prio",
  "type": "poll",
  "title": "Audience poll",
  "question": "Which area should we ship first in Q1?",
  "options": ["Public API", "Workspaces", "Audit log", "Mobile app"]
}
```

Results render via the `PollResultsOverlay` when audience devices vote
through the share QR.

### 10.4 `qa` — Q&A holding slide

| Field    | Type     | Required | Notes |
|----------|----------|----------|-------|
| `type`   | `"qa"`   | ✱        ||
| `prompt` | string ≤200 |       | optional headline (defaults to "Questions?") |

```jsonc
{
  "id": "qa",
  "type": "qa",
  "title": "Q&A",
  "prompt": "What did we miss?"
}
```

Typically the final slide of a deck. The share QR stays visible so the
audience can submit questions while you talk.

---

## 11. Authoring patterns

These are the patterns the editor and presenter view are tuned for. Following
them produces decks that look composed; breaking them produces decks that
look like dumped notes.

### 11.1 Highlights — `{ "text": "...", "pill": false|true }`

- **Underline highlight** (`pill` omitted or `false`): inline emphasis in
  accent color, no chip. Use for numbers, product names, and the one word
  per slide that should land hardest.
- **Pill highlight** (`pill: true`): rounded accent chip with padding.
  Reads as a tag/metric chip. Use 1–2 per slide max; 6+ on one slide
  flattens the emphasis.

```jsonc
"heading": [
  "Shipped ",
  { "text": "42 features" },              // underline
  " across ",
  { "text": "3 quarters", "pill": true }  // pill
]
```

Anti-patterns:
- Don't wrap an entire heading in one highlight — that defeats the contrast.
- Don't put a highlight inside another highlight (not supported by the schema).
- Don't use pill highlights inside `quote` slides — the chip fights the quote rhythm.

### 11.2 Kickers vs subtitles vs headings

| Element     | Field                       | Size    | Use for                                              |
|-------------|-----------------------------|---------|------------------------------------------------------|
| Kicker      | `kicker` (`left`, `bullets`)| 22px UC | Section tag above the headline — "Q4 2025", "PART 3"|
| Heading     | `heading`                   | 88px    | The slide's one idea                                 |
| Subhead     | `subhead` (`center` only)   | 52px    | One short supporting line under the headline         |
| Body        | `body` (`left` only)        | 32px    | 1 short paragraph (2–4 lines, ≤ ~60 chars/line)     |

A `center` slide gets `heading` + optional `subhead`. A `left` slide gets
optional `kicker` + `heading` + optional `body`. Don't try to stuff a
"subhead" into `body` on a `left` slide; if you need a subtitle, switch to
`center`.

### 11.3 When to use which slide type

| You want to…                                       | Use         |
|----------------------------------------------------|-------------|
| Open the deck, end a section, land one statement   | `center`    |
| Pair text with a photo or screenshot               | `left`      |
| Show 3–5 short ideas under one headline            | `bullets`   |
| Make the audience feel something a user said       | `quote`     |
| Walk through a process (1..8 steps, → advances)    | `steps`     |
| Show events along a horizontal rail (2..8)         | `timeline`  |
| Let an image carry the slide                       | `image`     |
| Embed a live demo or external page                 | `embed`     |
| Ask the audience to vote                           | `poll`      |
| Hold the floor for questions                       | `qa`        |

### 11.4 Multi-step SVG reveal — authoring tips

Whichever pattern from §10.1.4 you pick:

- **Author at 1920×1080.** SVGs whose `viewBox` matches the slide canvas
  line up cleanly with `focus` regions. If your SVG is smaller, scale or
  pad it; otherwise the per-step `focus` coordinates won't map.
- **Group the reveal layers** (`<g id="step-1">…</g>`) even in Pattern A so
  Pattern B is one search-and-replace away if you change your mind.
- **Keep each step ≤ ~30% of the canvas** for Pattern A. The camera lands
  more cleanly on a small rect than on something that almost fills the
  frame.
- **Add a `label` to every `focus` region** — it shows up in the focus
  editor (`F`) and makes the rehearsal export readable.
- **Don't pair a multi-step SVG with `transition: "camera-zoom"`** at the
  deck level. The per-step focus animation already moves the camera; layering
  a deck-wide zoom on top reads as motion sickness. Keep `transition: "fade"`.

### 11.5 Focus regions — per-step rules

- `focus: []` or omitted ⇒ full frame, no zoom. This is the default.
- A region with no `step` applies to every step on the slide.
- A region with `step: N` overrides the unbound region on that step.
- Up to 16 regions per slide.
- **Never put `focus` on `bullets`, `quote`, or `timeline` slides.** The
  core memory: lists/timelines must never scale or zoom. The renderer
  honors `focus` on these types but the result feels wrong — author it on
  the companion image slide instead.

### 11.6 Theme & background overrides

Two levels:

- **Deck level** — `deck.themeId` + `deck.settings.backgroundMode/Color/Image/darken/blur`.
  Applies to every slide that doesn't override.
- **Slide level** — `slide.themeId` swaps the theme for one slide;
  `slide.background` is a CSS color **or** an image URL / `data:` URI.

```jsonc
// One darker section divider inside an otherwise light deck:
{
  "id": "section-2",
  "type": "center",
  "title": "Part 2",
  "themeId": "noir",
  "background": "#0b0b12",
  "heading": ["Part 2 — ", { "text": "What we learned" }]
}
```

Use sparingly. A deck with a different theme on every slide reads as
inconsistent; one or two per-section overrides reads as intentional rhythm.

### 11.7 Density budget — sanity check before exporting

Mentally verify each slide:

```
header (~100px) + body content + footer (~80px) ≤ 1080px
```

Defaults (override only if the user explicitly asks for denser slides):

| Slide type | Hard cap                                                |
|------------|---------------------------------------------------------|
| `center`   | 1 headline + 1 short subhead                            |
| `left`     | 1 headline + 1 paragraph (2–4 lines) + 1 image          |
| `bullets`  | ≤4 bullets (≤60 chars each). 5–6 only if all very short |
| `quote`    | ≤2 sentences in the quote                               |
| `steps`    | ≤6 steps; each `detail` 1–2 short sentences             |
| `timeline` | ≤6 items; each `detail` 1 sentence                      |
| `image`    | 1 image + (optional) 1-line caption                     |

If a slide overflows, the first move is **split into another slide or cut
detail**, NOT shrink fonts. Use `text-[Npx]` overrides only when the user
explicitly asks for dense slides.

### 11.8 `enabled: false` — skipping slides

Set `enabled: false` to keep a slide in the deck JSON while removing it
from linear navigation, jump-to-slide, dot pagination, and the badge total.

Use for:
- Backup slides you may or may not show ("if asked: detailed pricing")
- Draft slides not yet ready to present
- Alternate variants of the same slide (keep both, ship one)

URLs still resolve directly to a disabled slide's index (deep links keep
working); → and ← skip over it.

### 11.9 Authored slide numbers (`number`)

By default the badge shows the 1-based linear position. Set `slide.number`
when the deck's "human" numbering differs:

- Two slides labelled `7` and `7a` for an alternate variant (`{ number: 7 }`
  on both, distinguish via `title` only — the audience sees the badge, the
  presenter sees the title)
- A workshop where slides are grouped (`1, 2, 3, 100, 101, 200, 201…`)
- A teaser deck where the first slide is intentionally `0`

**Authored numbers never change URLs.** `/slides/3` always means "the third
linear slide", regardless of what its badge says. This is a deliberate
contract — share links must be predictable.

### 11.10 Notes, budget, and the rehearsal export

- `notes` (≤4000 chars) appears only on the presenter view. Use Markdown-y
  plain text; no rendering is applied beyond `white-space: pre-wrap`.
- `budget` is the target dwell time in seconds. The pacing ring and the
  rehearsal report (`Cmd+E`) read it.
- Set `budget` on every slide once the deck is real — even rough numbers
  (`30`, `45`, `90`) make the rehearsal export useful. Without it, the
  pacing ring shows ∞ and the rehearsal export has no benchmark.

---

## 12. Full sample deck

A complete, importable deck that exercises every slide type and every
pattern in this guideline lives at
[`docs/slides/spec/sample-deck.json`](./sample-deck.json).

It includes:

- `center` cover with `display: true` and a pill highlight
- `left` text + URL image
- `bullets` with kicker + four pill highlights
- `quote` with attribution
- `steps` with three sub-step builds (no focus, plain process)
- `timeline` with four pinpoints
- `image` — full-bleed URL photo (`fit: "cover"`)
- `image` — base64 PNG (`data:image/png;base64,…`)
- `image` — inline SVG (`data:image/svg+xml;utf8,…`)
- `steps` slide with an SVG background + **per-step `focus` regions**
  (the recommended multi-step SVG reveal pattern)
- `embed` with `allow` flags
- `poll` with four options
- `bullets` with `enabled: false` (backup-only slide)
- `qa` closing slide

To try it: File → Import → paste the JSON. Every slide should validate
cleanly under `DeckSchema`.

---

## 13. Validation & import

The importer at `src/lib/slides/io.ts` runs `DeckSchema.parse(...)` and
rejects the file wholesale on any failure. There is no partial import.

The Zod schema enforces these rules; trust the schema over this doc:

- `id` patterns: `^[a-zA-Z0-9_-]+$`, 1–64 chars (deck id and every slide id).
- Slide-id uniqueness: enforced at import (duplicates rejected).
- `RichText` arrays must contain ≥ 1 segment, and at least one segment must
  be non-blank.
- `image.src` and `left.media.src` must match `^https?://…` OR start with
  `data:`. No relative paths, no bare filenames.
- `embed.url` must start with `https://` (no `http://`).
- `slides.length` between 1 and 200.
- `steps.length` between 1 and 8.
- `timeline.items.length` between 2 and 8.
- `bullets.length` between 1 and 8.
- `poll.options.length` between 2 and 8.
- `focus.length` ≤ 16 per slide.

If a parse fails, the importer surfaces the Zod issue path
(`slides[3].steps[2].detail`) — fix that node and re-import.

---

## 14. Common LLM mistakes (and the fix)

| Mistake                                                | Fix                                                                                       |
|--------------------------------------------------------|-------------------------------------------------------------------------------------------|
| `"heading": "Hello"` on a RichText field                | Wrap it in an array: `"heading": ["Hello"]`                                               |
| Highlight written as `{ "highlight": "..." }`           | The key is `text`, not `highlight`: `{ "text": "...", "pill": true }`                     |
| `"src": "/images/foo.png"` or bare filename             | Use a full `https://` URL or a `data:` URI                                                |
| `"src": "http://..."`                                   | Schema requires https for `embed.url`; image src also rejects bare http URLs              |
| Inline `<svg>` markup in `image.src`                    | Wrap as `data:image/svg+xml;utf8,<URL-encoded>` or `data:image/svg+xml;base64,<b64>`     |
| Duplicate slide `id`s                                   | Make every `id` unique within the deck                                                    |
| `slide.id` like `"1. Cover"` or `"Slide 1"` with space  | Must match `^[a-zA-Z0-9_-]+$` — use `cover-1` / `slide_1`                                |
| `transition: "zoom"`                                    | Allowed values: `"fade" \| "morph" \| "camera-zoom" \| "eaten"`                          |
| `steps` slide with `heading` as RichText                | `steps.heading` is a plain string. RichText is in `steps[i].detail`                       |
| `timeline` slide with only 1 item                       | Minimum 2 items                                                                           |
| Pill highlight on every bullet                          | Use 1–2 pills per slide; over-use kills the emphasis                                      |
| Forgetting `settings` block                             | `DeckSettings` is required — never optional                                               |
| `notes` as an array                                     | `notes` is a plain string (≤4000 chars)                                                   |
| `focus` on a `bullets` / `timeline` slide               | Lists/timelines must never zoom — move the `focus` to the companion image slide           |
| Embedding a multi-MB base64 image inline                | Host it and use a URL. Inline base64 should stay under ~200 KB                            |

---

## 15. Versioning & migration

- `deck.version` is an optional integer. Set `1` for any new deck.
- When the schema gains a breaking change, the importer in
  `src/lib/slides/io.ts` runs a migration keyed on `version` and rewrites
  the deck to the latest shape.
- Adding a new optional field is **not** a breaking change — old decks
  stay valid; you don't need to bump `version`.
- Adding a new required field, removing a field, or changing a field's
  type **is** breaking — bump `version` and add a migration.
- LLMs generating decks should always emit `"version": 1` until told
  otherwise. The current schema version is `1`.

---

## 16. Final checklist before exporting a deck

- [ ] `id`, `title`, `settings`, and at least one slide present at the deck root.
- [ ] Every slide has a unique URL-safe `id`.
- [ ] Every `RichText` field is an array with non-blank content.
- [ ] Every `image.src` / `media.src` is `https://` or `data:`.
- [ ] Every `embed.url` is `https://`.
- [ ] No `focus` on `bullets`, `quote`, or `timeline` slides.
- [ ] `settings.transition` is `"fade"` unless this deck is deliberately
      hero-only.
- [ ] Each slide passes the density budget
      (header ~100 + body + footer ~80 ≤ 1080 px).
- [ ] Real `budget` values on every slide that will be rehearsed.
- [ ] `version: 1` set explicitly.

If all 10 boxes are checked, the deck will import cleanly and present well.




