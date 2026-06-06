# 03 — `center` slide type

**Status:** spec stub (Plan 06 Phase A Step 8 first batch)
**Catalog group:** A — text-first
**Renderer today:** `CenterSlide` in `src/components/slides/RenderSlide.tsx:145-171`
**Type owner today:** `CenterSlideProps` in `src/components/slides/types.ts:103-108`

## 1. Purpose

Centered hero slide for a balanced headline and optional supporting subhead.

## 2. `content` schema (TypeScript)

```ts
interface CenterSlideContent {
  heading: RichText;
  subhead?: RichText;
  display?: boolean;
  align?: TextPosition;
  padding?: number;
  decor?: "code" | "none";
}

type CenterSlideEntry = SlideEntry<"center", CenterSlideContent>;
```

Compatibility note: the current runtime stores these fields on the slide root (`type: "center"`), not under `content`; Phase D migration keeps legacy `type` readable until `slideType` becomes canonical.

## 3. Layout

```txt
┌──────────────────────────── 1920 ────────────────────────────┐
│                                                               │
│                         optional decor                        │
│                                                               │
│                 ┌──────────────────────────┐                  │
│                 │ H1 heading               │                  │
│                 │ optional subhead         │                  │
│                 └──────────────────────────┘                  │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

- Default block position is `center`; `align` may move the block to any 9-cell position.
- `display: true` uses the larger display title class; otherwise it uses the standard title class.
- `decor: "code"` may enable the existing code-journey decorative layer behind text.

## 4. Theme hooks consumed

- Shared: `--slide-bg-base`, `--slide-fg-base`, `--slide-fg-muted`, `--slide-accent-base`, `--slide-focus-ring`.
- Text-first: `--slide-text-lead`, `--slide-text-body`, `--slide-highlight-bg`, `--slide-highlight-fg`.

## 5. Step behaviour

`none` — resolves to `/slides/N` only; `/slides/N/S` clamps to step 1.

## 6. Sample image + JSON link

- Sample image target: `assets/samples/center/01-center-hero.png`.
- JSON sample target: `docs/slides/spec/sample-deck.json` entry `center-display`.

## 7. A11y + reduced-motion rules

- Exactly one `h1` for `heading`.
- `subhead` remains supporting text, not a second heading.
- Decorative code icons are `aria-hidden` and MUST respect `useReducedMotion()`.

## 8. Test fixture name

`center-display.spec.tsx` — asserts display sizing class selection, subhead render, decor opt-in, and channel variables resolve.