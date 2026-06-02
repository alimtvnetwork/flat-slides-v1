# Glasswing — JSON-driven slide system

A presentation engine where every deck is a JSON file. Three themes,
six slide layouts, four transitions, full keyboard navigation,
and import/export at both deck and single-slide granularity.

Any LLM can author a deck — feed it `slides/README-LLM.md` and a
topic, drop the output into **Settings → Import deck**.

---

## Quickstart

```bash
bun install
bun dev
```

Open <http://localhost:5173>, click **Open deck →**, then:

- `→` / `Space` — next slide / step
- `←` — previous
- `F5` — fullscreen present
- `Esc` — exit fullscreen
- `G` — grid overview
- `S` — Settings (theme, background, transition, import/export)
- Double-click the slide counter — jump to any slide

---

## Features

- **3 themes** — `midnight`, `paper`, `sunset` (live-swappable; per-slide override).
- **6 slide types** — `center`, `left`, `steps`, `quote`, `bullets`, `image`.
- **9-cell text positioning** — `top-left` … `bottom-right` on every text slide.
- **Rich text** — inline highlight chips + pill badges, line breaks.
- **4 transitions** — `camera-zoom`, `morph`, `fade`, `eaten`.
- **Whoosh audio** — gated by reduced-motion + user toggle.
- **Persistent deck** — Zustand `persist` keeps your work between reloads.
- **Import / Export** — whole deck **or** single slide, JSON, schema-validated.
- **Type-safe** — Zod schemas mirror the TypeScript types 1:1.

---

## JSON authoring

Authoring quickref (full spec in [`slides/README-LLM.md`](./slides/README-LLM.md)):

```json
{
  "id": "demo",
  "title": "My Deck",
  "themeId": "midnight",
  "version": 1,
  "settings": {
    "backgroundMode": "color",
    "backgroundColor": "#101010",
    "darken": 0, "blur": 0,
    "transition": "camera-zoom",
    "soundEnabled": true, "volume": 0.6
  },
  "slides": [
    {
      "id": "cover", "type": "center", "title": "Cover",
      "display": true, "align": "center",
      "heading": ["Hello ", { "text": "world", "pill": true }]
    }
  ]
}
```

Demo deck: [`slides/decks/demo.deck.json`](./slides/decks/demo.deck.json).
Single slide: [`slides/decks/example.slide.json`](./slides/decks/example.slide.json).

---

## Project layout

```
src/
  components/slides/    # engine: types, store, themes, layouts, transitions, chrome
  lib/slides/           # JSON schema + import/export I/O
  routes/               # /, /slides, /slides/$slideId, /slides/$slideId/$step
slides/
  README-LLM.md         # full LLM authoring guide
  decks/                # example .deck.json + .slide.json
spec/
  SPEC.md               # original 100-step product spec
  IMPLEMENTATION_PLAN.md  # what got built, mapped to 100 atomic steps
```

---

## Docs

- [`spec/SPEC.md`](./spec/SPEC.md) — product spec (100 steps)
- [`spec/IMPLEMENTATION_PLAN.md`](./spec/IMPLEMENTATION_PLAN.md) — build map
- [`slides/README-LLM.md`](./slides/README-LLM.md) — JSON schema for LLM authors

---

## Stack

TanStack Start (React 19, Vite 7), Tailwind v4, Zustand, Zod, Motion, Sonner.

---

**Version 1.0.0** — first stable cut.
