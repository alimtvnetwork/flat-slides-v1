# 01 — Theme Hooks (CSS variable channels per slide group)

**Status:** spec (Plan 06 Phase A Step 8)
**Created:** 2026-06-06
**Owner of token surface:** `src/styles.css` (`:root` + `[data-theme="…"]`)
**Owner of per-slide override read:** `src/components/slides/render/<Id>Slide.tsx`
**Sibling spec:** `00-catalog.md` (35-type index)

Single source of truth for the CSS variable channels every slide type may
consume. Per-type stubs (`02-left.md` … `36-gallery.md`) MUST only reference
channels declared here. Renderers MUST NOT read raw color literals — every
themed surface resolves through one of these channels so palette swaps
(Phase E Steps 68–77) work without touching renderer code.

## 1. Channel naming rule

```
--slide-<group>-<role>
```

- `<group>` ∈ `bg | fg | accent | data | structure | media | interactive | compare`
- `<role>` ∈ `base | muted | strong | on | border | shadow | <semantic>`
- All values are `oklch(...)` or `color-mix(...)` of existing semantic tokens
  (`--background`, `--foreground`, `--primary`, …). Never hex.

Renderers consume channels via `var(--slide-…)`. Per-slide `themeId` swaps
the channel values inside a scoped `[data-slide-theme="…"]` block; per-slide
`background` continues to win as a one-off inline override.

## 2. Shared channels (every type)

| channel                       | default mapping                                  | purpose                          |
| ----------------------------- | ------------------------------------------------ | -------------------------------- |
| `--slide-bg-base`             | `var(--background)`                              | slide canvas                     |
| `--slide-bg-muted`            | `color-mix(in oklab, var(--background) 92%, var(--foreground) 8%)` | secondary surface |
| `--slide-fg-base`             | `var(--foreground)`                              | primary text                     |
| `--slide-fg-muted`            | `var(--muted-foreground)`                        | secondary text                   |
| `--slide-accent-base`         | `var(--primary)`                                 | accent (links, dots)             |
| `--slide-accent-on`           | `var(--primary-foreground)`                      | text on accent                   |
| `--slide-border-base`         | `var(--border)`                                  | dividers, card outlines          |
| `--slide-shadow-elegant`      | `0 10px 30px -10px color-mix(in oklab, var(--slide-accent-base) 30%, transparent)` | elevation |
| `--slide-focus-ring`          | `var(--ring)`                                    | keyboard focus                   |

## 3. Per-group channels

### Group A — text-first (`left`, `center`, `quote`, `bullets`, `steps`, `timeline`)
| channel                  | default                                          | used by              |
| ------------------------ | ------------------------------------------------ | -------------------- |
| `--slide-text-lead`      | `var(--slide-fg-base)`                           | h1/headline          |
| `--slide-text-body`      | `var(--slide-fg-base)`                           | paragraph            |
| `--slide-text-meta`      | `var(--slide-fg-muted)`                          | captions, attribution |
| `--slide-highlight-bg`   | `color-mix(in oklab, var(--slide-accent-base) 18%, transparent)` | RichText pill |
| `--slide-highlight-fg`   | `var(--slide-fg-base)`                           | RichText pill text   |
| `--slide-step-number`    | `oklch(0.78 0.14 85)` (gold)                     | numbered reveal      |
| `--slide-rail-base`      | `var(--slide-border-base)`                       | timeline rail        |
| `--slide-rail-active`    | `var(--slide-accent-base)`                       | timeline active seg  |

### Group B — media (`image`, `image-grid`, `image-compare`, `video`, `embed`, `code`, `terminal`)
| channel                  | default                                          | used by              |
| ------------------------ | ------------------------------------------------ | -------------------- |
| `--slide-media-bg`       | `var(--slide-bg-muted)`                          | letterbox            |
| `--slide-media-border`   | `var(--slide-border-base)`                       | frame outline        |
| `--slide-media-caption`  | `var(--slide-fg-muted)`                          | caption text         |
| `--slide-code-bg`        | `color-mix(in oklab, var(--slide-bg-base) 88%, var(--slide-fg-base) 12%)` | code surface |
| `--slide-code-fg`        | `var(--slide-fg-base)`                           | code text            |
| `--slide-code-keyword`   | `var(--slide-accent-base)`                       | syntax accent        |
| `--slide-terminal-bg`    | `oklch(0.18 0.02 260)`                           | terminal surface     |
| `--slide-terminal-fg`    | `oklch(0.95 0.01 100)`                           | terminal text        |

### Group C — data + diagrams (`chart-bar`, `chart-line`, `chart-pie`, `kpi`, `table`, `diagram`, `flow`, `matrix-2x2`)
| channel                  | default                                          | used by              |
| ------------------------ | ------------------------------------------------ | -------------------- |
| `--slide-data-series-1`  | `var(--chart-1)`                                 | bar/line/pie series  |
| `--slide-data-series-2`  | `var(--chart-2)`                                 | series 2             |
| `--slide-data-series-3`  | `var(--chart-3)`                                 | series 3             |
| `--slide-data-series-4`  | `var(--chart-4)`                                 | series 4             |
| `--slide-data-series-5`  | `var(--chart-5)`                                 | series 5             |
| `--slide-data-axis`      | `var(--slide-fg-muted)`                          | axes, gridlines      |
| `--slide-data-grid`      | `color-mix(in oklab, var(--slide-fg-muted) 25%, transparent)` | gridline soft |
| `--slide-kpi-value`      | `var(--slide-text-lead)`                         | big KPI number       |
| `--slide-kpi-delta-up`   | `oklch(0.72 0.16 150)`                           | +Δ                   |
| `--slide-kpi-delta-down` | `var(--destructive)`                             | −Δ                   |
| `--slide-flow-edge`      | `var(--slide-border-base)`                       | flow arrows          |
| `--slide-flow-node-bg`   | `var(--slide-bg-muted)`                          | flow nodes           |

### Group D — section + structure (`title`, `section`, `agenda`, `toc`, `summary`, `cta`)
| channel                  | default                                          | used by              |
| ------------------------ | ------------------------------------------------ | -------------------- |
| `--slide-section-fg`     | `var(--slide-text-lead)`                         | section label        |
| `--slide-section-rule`   | `var(--slide-border-base)`                       | divider line         |
| `--slide-toc-active`     | `var(--slide-accent-base)`                       | TOC current item     |
| `--slide-cta-bg`         | `var(--slide-accent-base)`                       | CTA card             |
| `--slide-cta-fg`         | `var(--slide-accent-on)`                         | CTA text             |

### Group E — interactive + speaker (`poll`, `qa`, `quiz`, `vote`)
| channel                  | default                                          | used by              |
| ------------------------ | ------------------------------------------------ | -------------------- |
| `--slide-option-bg`      | `var(--slide-bg-muted)`                          | answer chip          |
| `--slide-option-border`  | `var(--slide-border-base)`                       | answer chip outline  |
| `--slide-option-correct` | `oklch(0.72 0.16 150)`                           | quiz reveal correct  |
| `--slide-option-wrong`   | `var(--destructive)`                             | quiz reveal wrong    |
| `--slide-vote-bar`       | `var(--slide-accent-base)`                       | tally bar fill       |

### Group F — comparison + decision (`compare`, `pros-cons`, `decision`, `gallery`)
| channel                  | default                                          | used by              |
| ------------------------ | ------------------------------------------------ | -------------------- |
| `--slide-compare-a`      | `var(--slide-data-series-1)`                     | side A               |
| `--slide-compare-b`      | `var(--slide-data-series-2)`                     | side B               |
| `--slide-pros-fg`        | `oklch(0.72 0.16 150)`                           | pros tick            |
| `--slide-cons-fg`        | `var(--destructive)`                             | cons cross           |
| `--slide-decision-edge`  | `var(--slide-border-base)`                       | tree edges           |
| `--slide-gallery-thumb`  | `var(--slide-bg-muted)`                          | thumbnail surface    |

## 4. Override precedence (highest wins)

1. Inline `style={{ background }}` from `slide.background` (one-off image/color).
2. Scoped `[data-slide-theme="<themeId>"]` block (per-slide theme override).
3. Deck `[data-theme="<deckThemeId>"]` block (Phase E palette).
4. `:root` defaults above.

A per-slide channel override MUST be set on the slide root element via
`style={{ '--slide-accent-base': 'oklch(...)' }}` — never via class string
concatenation, and never bypassing the channel by writing the literal in JSX.

## 5. Authoring rules (enforced by linter in Phase E Step 77)

- Renderers MUST NOT import or hardcode hex/`rgb()`/`hsl()`/literal `oklch()`
  outside `src/styles.css`. Use `var(--slide-…)` only.
- A new slide type MUST declare every channel it consumes in its per-type
  stub §4 ("Theme hooks consumed"). Channels not in this file fail review.
- Animations consult `useReducedMotion()`; reduced-motion variants MAY swap
  to a flat channel (e.g. drop `--slide-shadow-elegant` to `none`) but MUST
  preserve contrast tokens (`fg`/`bg`).

## 6. Test fixtures

- `src/components/slides/theme/__tests__/channels.test.ts` (Phase E Step 76)
  asserts every channel resolves to a non-empty computed style on the
  default and dark themes, for each group's representative type.
- Per-type tests reference channels by name (`getComputedStyle(el).getPropertyValue('--slide-accent-base')`)
  rather than literal colors, so palette swaps don't break tests.

## 7. Out of scope

- Per-type renderer wiring (Phase D Steps 33–67).
- Palette presets (Phase E Steps 68–75) — those define VALUES; this file
  defines the CHANNEL SURFACE.
- LLM JSON schema rewrite (Phase F Step 78) — channels are read-only from
  authored decks; LLM may not name channels directly, only `themeId`.
