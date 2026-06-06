# 02 — `left` slide type

**Status:** spec stub (Plan 06 Phase A Step 8 first batch)
**Catalog group:** A — text-first
**Renderer today:** `LeftSlide` in `src/components/slides/RenderSlide.tsx:104-143`
**Type owner today:** `LeftSlideProps` in `src/components/slides/types.ts:95-101`

## 1. Purpose

Left-aligned narrative slide for a headline, optional kicker/body, and optional supporting media.

## 2. `content` schema (TypeScript)

```ts
interface LeftSlideContent {
  kicker?: string;
  heading: RichText;
  body?: RichText;
  media?: MediaSource;
  align?: TextPosition;
  padding?: number;
}

type LeftSlideEntry = SlideEntry<"left", LeftSlideContent>;
```

Compatibility note: the current runtime stores these fields on the slide root (`type: "left"`), not under `content`; Phase D migration keeps legacy `type` readable until `slideType` becomes canonical.

## 3. Layout

```txt
┌──────────────────────────── 1920 ────────────────────────────┐
│                                                               │
│   120px                                                        │
│   ┌───────────────────────┐       ┌───────────────────────┐   │
│   │ kicker                │       │ optional media         │   │
│   │ H1 heading            │       │ max 760×760            │   │
│   │ body copy             │       │                        │   │
│   └───────────────────────┘       └───────────────────────┘   │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

- Without `media`, text spans the full safe width with `px: 120`.
- With `media`, text uses 48% width and media uses 52% width.
- `align` may right-align text, but the block remains in the left narrative zone.

## 4. Theme hooks consumed

- Shared: `--slide-bg-base`, `--slide-fg-base`, `--slide-fg-muted`, `--slide-accent-base`, `--slide-focus-ring`.
- Text-first: `--slide-text-lead`, `--slide-text-body`, `--slide-text-meta`, `--slide-highlight-bg`, `--slide-highlight-fg`.
- Media (only when `media` is present): `--slide-media-bg`, `--slide-media-border`, `--slide-media-caption`.

## 5. Step behaviour

`none` — resolves to `/slides/N` only; `/slides/N/S` clamps to step 1.

## 6. Sample image + JSON link

- Sample image target: `assets/samples/left/01-left-narrative.png`.
- JSON sample target: `docs/slides/spec/sample-deck.json` entry `left-basic`.

## 7. A11y + reduced-motion rules

- Exactly one `h1` for `heading`.
- Media requires non-empty `alt` when it communicates content; decorative media uses `alt: ""`.
- No animated surface is required. If media later animates, it MUST consult `useReducedMotion()`.

## 8. Test fixture name

`left-basic.spec.tsx` — asserts heading/body render, optional media alt handling, and channel variables resolve.