# 00 — Slide-Types Catalog (35-type index)

**Status:** spec (Plan 06 Phase A Step 7)
**Created:** 2026-06-06
**Owner of enum:** `src/components/slides/types.ts` (`SlideType` union)
**Owner of renderer dispatch:** `src/components/slides/RenderSlide.tsx`

Single source of truth for every slide type the engine renders. The 35 type
ids below MUST match the `SlideType` union and the renderer switch. Per-type
stubs (Steps 8–12) live as siblings: `01-<id>.md`, `02-<id>.md`, …

Existing types (10) are preserved verbatim; the 25 new types extend the union.
Per-type stubs document the shape; this file locks the shared contract.

## 1. Shared shape (all types)

Each type extends `BaseSlide` (`src/components/slides/types.ts:42-80`) and
adds a typed `content` object plus a `slideType` literal.

```ts
interface SlideEntry<TType extends string, TContent> extends BaseSlide {
  slideType: TType;
  content: TContent;
}
```

### Required per type
- **`slideType` literal** — exact id from the table below.
- **`content` schema** — every type defines required + optional fields. No
  free-form `extra` bag.
- **Render entry** — one component under `src/components/slides/render/<Id>Slide.tsx`,
  registered in `RenderSlide.tsx`'s type→component map.
- **Sample image** — at least one reference in `assets/samples/<id>/*.png` plus
  a JSON sample in `docs/slides/spec/sample-deck.json`.
- **Theme hooks** — declared in `01-theme-hooks.md`; per-type overrides MUST
  use only the declared CSS variable channels.
- **Step participation** — declare whether the type participates in the
  `/slides/N/S` step URL contract (only `steps`, `timeline`, and any new
  multi-step types).
- **Reduced-motion contract** — every animated surface MUST consult
  `useReducedMotion()`; never inline `matchMedia`.

### Per-type stub file shape
```
spec/old-slides/26-slide-definitions/<NN>-<id>.md
  1. Purpose (1 sentence)
  2. content schema (TypeScript)
  3. Layout (ASCII / grid math)
  4. Theme hooks consumed
  5. Step behaviour (none | steps | timeline)
  6. Sample image + JSON link
  7. A11y + reduced-motion rules
  8. Test fixture name
```

## 2. The 35 types (canonical ids)

Group A — text-first (preserved, 6):
| #  | id          | step | purpose                              |
| -- | ----------- | ---- | ------------------------------------ |
| 01 | `left`      | none | left-aligned text block              |
| 02 | `center`    | none | centered hero text                   |
| 03 | `quote`     | none | pull-quote + attribution             |
| 04 | `bullets`   | none | bullet list                          |
| 05 | `steps`     | yes  | stepped reveal (numbered, gold)      |
| 06 | `timeline`  | yes  | horizontal rail w/ pinpoints         |

Group B — media (preserved + extended, 7):
| #  | id              | step | purpose                              |
| -- | --------------- | ---- | ------------------------------------ |
| 07 | `image`         | none | single hero image                    |
| 08 | `image-grid`    | none | 2..6 image grid                      |
| 09 | `image-compare` | none | before/after slider                  |
| 10 | `video`         | none | inline video                         |
| 11 | `embed`         | none | iframe embed (existing)              |
| 12 | `code`          | none | syntax-highlighted code block        |
| 13 | `terminal`      | none | mock terminal cast                   |

Group C — data + diagrams (8 new):
| #  | id              | step | purpose                              |
| -- | --------------- | ---- | ------------------------------------ |
| 14 | `chart-bar`     | none | bar chart                            |
| 15 | `chart-line`    | none | line chart                           |
| 16 | `chart-pie`     | none | pie / donut                          |
| 17 | `kpi`           | none | 1..4 large KPI tiles                 |
| 18 | `table`         | none | tabular data                         |
| 19 | `diagram`       | none | inline SVG diagram                   |
| 20 | `flow`          | yes  | left→right flow boxes                |
| 21 | `matrix-2x2`    | none | 2×2 quadrant matrix                  |

Group D — section + structure (6 new):
| #  | id              | step | purpose                              |
| -- | --------------- | ---- | ------------------------------------ |
| 22 | `title`         | none | deck title slide                     |
| 23 | `section`       | none | section divider                      |
| 24 | `agenda`        | none | agenda list                          |
| 25 | `toc`           | none | table of contents (linked)           |
| 26 | `summary`       | none | summary recap                        |
| 27 | `cta`           | none | call-to-action card                  |

Group E — interactive + speaker (4 preserved + new, 4):
| #  | id          | step | purpose                                  |
| -- | ----------- | ---- | ---------------------------------------- |
| 28 | `poll`      | none | live poll (existing)                     |
| 29 | `qa`        | none | Q&A slide (existing)                     |
| 30 | `quiz`      | yes  | multi-step quiz w/ reveal                |
| 31 | `vote`      | none | binary/multi vote                        |

Group F — comparison + decision (4 new):
| #  | id              | step | purpose                              |
| -- | --------------- | ---- | ------------------------------------ |
| 32 | `compare`       | none | side-by-side compare cards           |
| 33 | `pros-cons`     | none | pros / cons split                    |
| 34 | `decision`      | yes  | decision tree (stepped reveal)       |
| 35 | `gallery`       | yes  | step-through image gallery           |

## 3. Migration & compatibility

- The current `SlideType` union (`left | center | steps | timeline | quote | bullets | image | poll | qa | embed`) maps 1:1 to the catalog ids above.
- A new field `slideType` is added alongside the legacy `type` field to
  carry the catalog id during the transition. `type` remains the source of
  truth until Phase D Step 33; after that, `slideType` becomes the
  source and `type` is removed.
- Decks authored before this catalog continue to render — the renderer maps
  legacy `type` → catalog `slideType` on read.

## 4. Step URL contract

Only types marked `step: yes` in Section 2 participate in the
`/slides/N/S` step URL contract via `slideStepCount(slide)`
(`@/components/slides/types`). All other types resolve `S = 1` only.
This is consistent with the existing rule in project memory.

## 5. Variety guard (informational)

A linter check (Plan 06 Step 14) will flag decks where >60% of slides share a
single `slideType`. Catalog ids above are the inputs to that guard.

## 6. Out of scope

- Per-type renderer code (Phase D Steps 33–67).
- Theme hook surface — see `01-theme-hooks.md` (Step 8).
- LLM JSON schema rewrite — Phase F Step 78.
