# Theme JSON Guideline (for humans and LLMs)

This document is the single source of truth for the **theme JSON** format
that Riseup Slides imports and exports. Hand this file to any LLM and it
will be able to generate new themes that work out of the box **in one shot,
in a single file** — either one theme object, or one batch object with
`{ "themes": [...] }`. Never split themes across multiple files.

> Companion spec: [`llm-json-guideline.md`](./llm-json-guideline.md) describes
> the deck format (same one-file rule). Themes are referenced from a deck via
> `themeId` (deck-level) or `slide.themeId` (per-slide override). Linked from
> the root [`README.md`](../../../README.md) as the canonical theme contract.


## Where themes live in the UI

- **Settings → Theme** lists every built-in theme plus your imported custom
  themes. Each tile is a one-click switch. Custom theme tiles also expose
  a per-tile export (⬇) and delete (✕) button.
- **Import** opens a file picker. Accepts one theme or a batch.
- **Export** downloads `themes.json` containing every theme (built-ins +
  custom). Use this to back up or share your palette.
- Custom themes are persisted in `localStorage` under
  `riseup.themes.custom`. They survive page reloads but are scoped to the
  current browser.

## File formats

The importer accepts **two** shapes:

### Single theme

```json
{
  "id": "ocean",
  "name": "Ocean Breeze",
  "bg": "#0b1f2a",
  "fg": "#eaf6ff",
  "muted": "#7fa3b8",
  "hl": "#39d4c2",
  "hlInk": "#03161e"
}
```

### Batch of themes

```json
{
  "themes": [
    { "id": "ocean",  "name": "Ocean Breeze", "bg": "#0b1f2a", "fg": "#eaf6ff", "muted": "#7fa3b8", "hl": "#39d4c2", "hlInk": "#03161e" },
    { "id": "ember",  "name": "Ember",        "bg": "#1a0b08", "fg": "#fff2e6", "muted": "#c89a85", "hl": "#ff7a3a", "hlInk": "#1a0b08" },
    { "id": "forest", "name": "Forest",       "bg": "#0e1a12", "fg": "#e6f4e8", "muted": "#86a895", "hl": "#9be36b", "hlInk": "#0b1a0e" }
  ]
}
```

The exporter writes a single object when exporting one theme, and a
`{ "themes": [...] }` object when exporting many. Both shapes round-trip.

## Field reference

| Field          | Required | Type                              | Notes                                                                                       |
| -------------- | -------- | --------------------------------- | ------------------------------------------------------------------------------------------- |
| `id`           | yes      | string (1–64, `a–z 0–9 -`)        | Stable identifier. Used by `slide.themeId` / `deck.themeId`. Importing a theme whose `id` matches an existing custom theme **overwrites** it. Built-in ids (`snow`, `midnight`, `paper`, `sunset`, `print`) are reserved — do not reuse. |
| `name`         | yes      | string (1–80)                     | Display label shown in the picker. Keep under ~22 chars to avoid truncation in the tile.   |
| `bg`           | yes      | hex color `#rgb` / `#rrggbb`      | Base slide background. Most layouts fill the entire 1920×1080 canvas with this color.       |
| `fg`           | yes      | hex color                         | Primary text color (titles, body). Aim for **WCAG AA** contrast against `bg` (≥ 4.5:1).     |
| `muted`        | yes      | hex color                         | Secondary text (captions, eyebrows, footer). Lower contrast, but still ≥ 3:1 against `bg`. |
| `hl`           | yes      | hex color                         | Inline highlight color. Used as `.hl` text color **and** `.hl-pill` chip background.        |
| `hlInk`        | yes      | hex color                         | Text color inside a `.hl-pill` chip. Must contrast strongly against `hl` (≥ 4.5:1).         |
| `fontHeading`  | no       | CSS font-family string            | Defaults to `"Ubuntu", system-ui, sans-serif`. Quoted family names must keep quotes inside the JSON string. |
| `fontBody`     | no       | CSS font-family string            | Defaults to `"Poppins", system-ui, sans-serif`.                                             |
| `fontDisplay`  | no       | CSS font-family string            | Defaults to `"Instrument Serif", "Ubuntu", serif`. Used by `.slide-display` accent text.    |

Unknown fields are rejected by the Zod validator with a friendly error.

## Generation guidelines for LLMs

When asked to design a new theme, follow these rules:

1. **Contrast first.** Verify `bg`↔`fg` ≥ 4.5:1, `bg`↔`muted` ≥ 3:1,
   `hl`↔`hlInk` ≥ 4.5:1. A theme that fails contrast is unusable.
2. **Pick a mood.** Decide _light-on-dark_ or _dark-on-light_ up front
   and keep it consistent. Mixed-mode themes (e.g. dark `fg` on dark `bg`)
   are almost always a mistake.
3. **`hl` is the accent.** Choose a single chromatic accent that pops
   against both `bg` and `fg`. Avoid grays — the accent must read as the
   primary visual emphasis.
4. **`muted` is `fg` softened.** Typically `fg` shifted ~40% toward `bg`
   with slightly reduced chroma. Never use a totally different hue.
5. **`hlInk` is the inverse mood of `hl`.** A bright `hl` wants a dark
   `hlInk`; a dark `hl` wants a light `hlInk`.
6. **Honor brand cues if given.** If the user provides brand colors or a
   mood ("calm", "energetic", "luxury"), match it. Otherwise reach for
   classic palette schemes: complementary, analogous, or triadic.
7. **Stable ids.** Use lowercase, hyphenated, descriptive ids
   (`ocean-deep`, not `Theme_1`). The id is part of the public contract.
8. **Leave fonts alone unless asked.** The defaults (Ubuntu / Poppins /
   Instrument Serif) are already loaded by the app. Custom font families
   only render if the browser has them — never invent obscure foundries.

### Example: light editorial theme

```json
{
  "id": "linen",
  "name": "Linen",
  "bg": "#f6f1e7",
  "fg": "#1d1a16",
  "muted": "#6e6a62",
  "hl": "#b8442a",
  "hlInk": "#fff6ee"
}
```

### Example: vibrant dark theme

```json
{
  "id": "neon-violet",
  "name": "Neon Violet",
  "bg": "#0a0814",
  "fg": "#f6eeff",
  "muted": "#9a87b8",
  "hl": "#c084fc",
  "hlInk": "#1b0c2c"
}
```

### Example: high-contrast accessibility theme

```json
{
  "id": "ink-paper",
  "name": "Ink on Paper",
  "bg": "#ffffff",
  "fg": "#000000",
  "muted": "#3a3a3a",
  "hl": "#ffeb00",
  "hlInk": "#000000"
}
```

## Validation rules (mirrors `customThemes.ts → ThemeSchema`)

- All color fields must match `^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$`.
- `id` must match `^[a-z0-9-]+$` and be ≤ 64 characters.
- `name` must be 1–80 characters.
- Font fields, if present, must be 1–200 characters.
- Batches must contain 1–50 themes.

Invalid JSON, unknown fields, or any rule violation rejects the **entire**
import with a toast — partial imports are intentionally not supported,
because a broken theme would silently corrupt presentation rendering.

## Programmatic usage

```ts
import {
  parseThemesJson,
  upsertCustomThemes,
  downloadThemesJson,
  loadCustomThemes,
} from "@/components/slides/customThemes";

// Import
const themes = parseThemesJson(jsonText);
upsertCustomThemes(themes);

// Export
downloadThemesJson(loadCustomThemes(), "my-palette.json");
```
