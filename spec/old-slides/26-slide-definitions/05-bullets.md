# 05 — `bullets` slide type

**Status:** spec stub (Plan 06 Phase A Step 8 first batch)
**Catalog group:** A — text-first
**Renderer today:** `BulletsSlide` in `src/components/slides/RenderSlide.tsx:536-572`
**Type owner today:** `BulletsSlideProps` in `src/components/slides/types.ts:146-151`

## 1. Purpose

Scannable list slide for a heading and ordered visual rhythm of key bullet points.

## 2. `content` schema (TypeScript)

```ts
interface BulletsSlideContent {
  heading: RichText;
  kicker?: string;
  bullets: RichText[];
  align?: TextPosition;
  padding?: number;
}

type BulletsSlideEntry = SlideEntry<"bullets", BulletsSlideContent>;
```

Compatibility note: the current runtime stores these fields on the slide root (`type: "bullets"`), not under `content`; Phase D migration keeps legacy `type` readable until `slideType` becomes canonical.

## 3. Layout

```txt
┌──────────────────────────── 1920 ────────────────────────────┐
│                                                               │
│   optional kicker                                             │
│   H1 heading                                                  │
│                                                               │
│   • bullet one                                                │
│   • bullet two                                                │
│   • bullet three                                              │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

- Default block position is `center-left` with `padding: 120`.
- Bullet list max width is 1400px on the 1920×1080 design canvas.
- Visual bullets are token-colored dots; authored bullet text remains plain RichText.

## 4. Theme hooks consumed

- Shared: `--slide-bg-base`, `--slide-fg-base`, `--slide-fg-muted`, `--slide-accent-base`, `--slide-focus-ring`.
- Text-first: `--slide-text-lead`, `--slide-text-body`, `--slide-text-meta`, `--slide-highlight-bg`, `--slide-highlight-fg`.

## 5. Step behaviour

`none` — resolves to `/slides/N` only; `/slides/N/S` clamps to step 1. Incremental bullet reveal belongs to `steps`, not this type.

## 6. Sample image + JSON link

- Sample image target: `assets/samples/bullets/01-bullets-list.png`.
- JSON sample target: `docs/slides/spec/sample-deck.json` entry `bullets-list`.

## 7. A11y + reduced-motion rules

- Render bullets as a semantic `ul`/`li` list.
- Decorative dot markers are `aria-hidden`.
- No animated surface is required; list/step surfaces must never zoom.

## 8. Test fixture name

`bullets-list.spec.tsx` — asserts semantic list length, kicker/heading render, RichText highlight handling, and channel variables resolve.