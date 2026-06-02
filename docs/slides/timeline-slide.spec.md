# Timeline Slide — Spec

A focused, step-by-step slide type for walking an audience through an ordered
sequence (process, roadmap, agenda). Each press of `→` advances focus to the
next pinpoint with animation; `←` moves focus backwards. The focused step is
fully visible and its detail text shows large in the centre of the slide. All
other steps fade to a muted/grey state.

This spec is the source of truth — any AI implementing the timeline slide
should match it.

## Data Shape

```ts
interface TimelineSlideProps extends BaseSlide {
  type: "timeline";
  heading?: string;                  // optional short title above the line
  items: TimelineItem[];             // 2–8 milestones (rendered as pinpoints)
}

interface TimelineItem {
  label: string;                     // short tag under the pinpoint (e.g. "Q1", "Discover", "Step 1")
  title?: string;                    // bold focus heading shown when active (1 line)
  detail?: RichText;                 // detail paragraph shown centred when active (1–3 short lines)
}
```

JSON example:

```json
{
  "id": "roadmap",
  "type": "timeline",
  "title": "2026 Roadmap",
  "heading": "Roadmap",
  "items": [
    { "label": "Q1", "title": "Discovery", "detail": ["Interview ", { "text": "20 customers" }, "."] },
    { "label": "Q2", "title": "Prototype", "detail": ["Validate the ", { "text": "core flow" }, "."] },
    { "label": "Q3", "title": "Beta", "detail": ["Ship to ", { "text": "design partners" }, "."] },
    { "label": "Q4", "title": "GA", "detail": ["Launch publicly."] }
  ]
}
```

## Layout (1920×1080)

```
┌──────────────────────────────────────────────────────────────────┐
│  Roadmap                                                          │ ← optional heading (slide-kicker / muted)
│                                                                   │
│                                                                   │
│                 ┌──────────────────────────┐                      │
│                 │  Q2 · Prototype          │                      │ ← focused step title (slide-title)
│                 │                          │                      │
│                 │  Validate the core flow. │                      │ ← focused detail (slide-body-lg, centred)
│                 └──────────────────────────┘                      │
│                                                                   │
│                                                                   │
│        ●━━━━━━━━━●━━━━━━━━━●━━━━━━━━━○━━━━━━━━━○                  │ ← timeline rail
│        Q1        Q2        Q3        Q4        Q5                 │ ← labels under each pinpoint
│                                                                   │
│                                  Step 2 / 5                       │ ← chrome counter (bottom-right)
└──────────────────────────────────────────────────────────────────┘
```

- Centre detail block lives in the upper-middle (y ≈ 360, vertically centred above the rail).
- Rail sits at y ≈ 780, runs from x = 240 to x = 1680 with equal-spaced pinpoints.
- Bottom chrome `Step N / Total` mirrors the existing `StepsSlide` chrome.

## Rail and Pinpoints

- Rail is a 4px horizontal line, colour `var(--slide-muted)` at 25% opacity.
- The "completed" portion (from start to focused pinpoint) is drawn over the
  base rail in `var(--slide-hl)` at full opacity, animating its width when
  focus changes (`width 450ms cubic-bezier(0.22, 1, 0.36, 1)`).
- Each pinpoint is a circle:
  - **Default**: 18px, border 2px `var(--slide-muted)`, fill transparent.
  - **Completed (index < focus)**: 18px, filled `var(--slide-hl)`, no border.
  - **Focused (index === focus)**: 28px, filled `var(--slide-hl)`, with a
    32px outer ring at 35% opacity (pulse-once on focus change, no infinite
    pulse).
- Labels under pinpoints use `.slide-caption`. Non-focused labels at 35%
  opacity, focused label at 100% with `font-weight: 600`.
- Transitions on every pinpoint and label: `opacity 350ms ease, transform
  350ms ease, background 350ms ease`.

## Centre Detail

- Wrap the focused item's `title` + `detail` in a motion-keyed block
  (`key={focusIndex}`) so it cross-fades + slides up 12px when focus changes.
- Title: `.slide-title` (≈88px), shows `${label} · ${title}` when both exist,
  otherwise whichever is present.
- Detail: `.slide-body-lg` (≈40px), max-width 1100px, centred, 1–3 lines.
- If `detail` is missing, omit the paragraph (don't render an empty block).

## Navigation Contract

The timeline slide participates in the existing step-URL contract:

- URL `/slides/N` shows focus on item 0 (first pinpoint).
- URL `/slides/N/S` shows focus on item `S` (0-indexed in URL terms, matching
  how the `StepsSlide` already encodes step).
- `→` / `Space` / `Enter` advance focus by one; on the last item, advance to
  the next slide.
- `←` reverses focus; from focus 0, go to the previous slide.
- The control bar shows `Step F / Total` where `Total = items.length` and
  `F = focusIndex + 1`.

This means **the route files and `ControlBar` must treat `type: "timeline"`
exactly like `type: "steps"`** when computing step count. Add a helper:

```ts
// in src/components/slides/types.ts (or a small util file)
export function slideStepCount(slide: Slide): number {
  if (slide.type === "steps") return slide.steps.length;
  if (slide.type === "timeline") return slide.items.length;
  return 0;
}
```

Then use that helper everywhere instead of inlining `slide.type === "steps"
? slide.steps.length : undefined`.

## Animation Budget

The user wants **less zoom on slide-to-slide transitions** — the deck-wide
default transition was `camera-zoom`, which made every navigation feel like
a heavy zoom. Defaults now:

- `DeckSettings.transition` default: `"fade"` (was `"camera-zoom"`).
- Step-within-slide animation (the timeline focus moving) is local to the
  slide — it does NOT trigger the deck transition.
- Lists/steps **do not** scale or zoom. Movement is restricted to opacity +
  ≤16px translate.
- `camera-zoom` remains available as an opt-in for hero/title moments only.

## Lint Rules

Add to `lintDeck`:

- `timeline-too-many` (warn): `items.length > 6`.
- `timeline-empty-item` (error): any item with an empty `label`.
- `timeline-no-detail` (warn): no item has a `detail` — the centre area
  would always be empty.

## Schema (Zod)

Add `TimelineItemSchema` and `TimelineSlideSchema` to
`src/lib/slides/schema.ts` and include it in the `SlideSchema`
discriminated union. Mirrors the type exactly.

## Persistence

Bumping the slide-type enum invalidates older persisted decks for users who
have customised content (their old deck won't include the timeline sample,
which is fine — they keep their own deck). The default deck adds one
`timeline` sample slide; users who never customised will see it after the
in-store version bump triggers a fresh seed.
