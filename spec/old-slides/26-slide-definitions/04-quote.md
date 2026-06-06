# 04 — `quote` slide type

**Status:** spec stub (Plan 06 Phase A Step 8 first batch)
**Catalog group:** A — text-first
**Renderer today:** `QuoteSlide` in `src/components/slides/RenderSlide.tsx:516-534`
**Type owner today:** `QuoteSlideProps` in `src/components/slides/types.ts:140-144`

## 1. Purpose

Pull-quote slide for a large quotation and optional attribution.

## 2. `content` schema (TypeScript)

```ts
interface QuoteSlideContent {
  quote: RichText;
  attribution?: string;
  align?: TextPosition;
  padding?: number;
}

type QuoteSlideEntry = SlideEntry<"quote", QuoteSlideContent>;
```

Compatibility note: the current runtime stores these fields on the slide root (`type: "quote"`), not under `content`; Phase D migration keeps legacy `type` readable until `slideType` becomes canonical.

## 3. Layout

```txt
┌──────────────────────────── 1920 ────────────────────────────┐
│                                                               │
│                 “quote text set as display type”              │
│                                                               │
│                         — attribution                         │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

- Default block position is centered with `padding: 160`.
- Quote text uses display scale and balanced wrapping.
- Attribution sits below the quote with muted body typography.

## 4. Theme hooks consumed

- Shared: `--slide-bg-base`, `--slide-fg-base`, `--slide-fg-muted`, `--slide-accent-base`, `--slide-focus-ring`.
- Text-first: `--slide-text-lead`, `--slide-text-meta`, `--slide-highlight-bg`, `--slide-highlight-fg`.

## 5. Step behaviour

`none` — resolves to `/slides/N` only; `/slides/N/S` clamps to step 1.

## 6. Sample image + JSON link

- Sample image target: `assets/samples/quote/01-quote-pull.png`.
- JSON sample target: `docs/slides/spec/sample-deck.json` entry `quote-pull`.

## 7. A11y + reduced-motion rules

- Render as a semantic quote block in Phase D (`blockquote` + `figcaption` when attribution exists).
- Keep typographic quotation marks visual only if they duplicate semantic quote markup.
- No animated surface is required.

## 8. Test fixture name

`quote-pull.spec.tsx` — asserts semantic quote structure, attribution render, RichText highlight handling, and channel variables resolve.