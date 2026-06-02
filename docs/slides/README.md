# Slides — Feature Reference

Source-of-truth shortcut sheet and module map for the slides app.

**LLM-targeted JSON spec:** see
[`spec/llm-json-guideline.md`](./spec/llm-json-guideline.md) and the
importable [`spec/sample-deck.json`](./spec/sample-deck.json).

## Routes

| URL                          | Purpose                                |
|------------------------------|----------------------------------------|
| `/slides`                    | Grid / overview                        |
| `/slides/:n`                 | Single slide (1-based linear position) |
| `/slides/:n/:step`           | Sub-step of a stepped slide            |
| `/audience/:sessionId`       | Audience-facing companion view         |

## Keyboard Shortcuts

| Group       | Keys              | Action                                  |
|-------------|-------------------|-----------------------------------------|
| Navigation  | ← / →             | Prev / Next slide (or step)             |
| Navigation  | Space / Enter     | Next slide (or step)                    |
| Navigation  | G                 | Open deck overview                      |
| Navigation  | Esc               | Exit fullscreen                         |
| Presenter   | F5                | Toggle fullscreen                       |
| Presenter   | ⌘K                | Command palette                         |
| Presenter   | ? or /            | Show shortcuts                          |
| Presenter   | M                 | Toggle background music                 |
| Presenter   | S                 | Cycle scene preset                      |
| Surfaces    | J                 | Toggle top jumper                       |
| Camera      | C                 | Toggle camera bubble                    |
| Camera      | Shift+C           | Cycle camera size                       |
| Camera      | Shift+←→↑↓        | Nudge camera position                   |
| Annotate    | L / K / X / 1–5   | Pointer · Ink · Clear · Color           |
| Timer       | T / Shift+T / R   | Toggle overlay · Reset · Rehearsal      |
| Timer       | ⌘E                | Export rehearsal report                 |
| Annotate    | ⌘⇧E               | Export annotations (JSON)               |
| Audience    | Q / V / Y         | QR · Live results · Copy share link     |
| Presenter   | F                 | Edit focus regions                      |
| Camera      | P                 | Picture-in-picture                      |
| Annotate    | L                 | Toggle laser pointer                    |
| Annotate    | K                 | Toggle ink (draw)                       |
| Annotate    | X                 | Clear ink on current slide              |
| Annotate    | 1–5               | Pick ink color                          |
| Annotate    | ⌘Z                | Undo last stroke                        |
| Timer       | T                 | Toggle timer overlay                    |
| Timer       | Shift+T           | Reset timer                             |
| Timer       | R                 | Toggle rehearsal mode                   |
| Timer       | Shift+R           | Reset rehearsal data                    |
| Timer       | Shift+Space       | Pause/resume timer                      |
| Audience    | Q                 | Toggle audience QR overlay              |
| Audience    | V                 | Toggle live poll results                |
| Audience    | Y                 | Copy share link to clipboard            |

## Accessibility & motion
All slide motion (transitions, camera-zoom, in-slide reveals) consults `useReducedMotion()`. When the OS flag is on, transitions collapse to a 50 ms opacity fade and camera-zoom snaps to scale instantly.

## Annotation persistence
Ink strokes are session-only by default. Enable **Settings → Presenter tools → Persist annotations across reloads** to mirror them into `localStorage`.

## Module Map

```
src/components/slides/
  store.ts                — deck state (Zustand + persist)
  chrome-store.ts         — presenter chrome / scene / camera / music
  timer-store.ts          — presentation timer + rehearsal dwell
  annotations-store.ts    — ink strokes per slide
  audience-store.ts       — sessionId + live poll tally
  themes.ts               — slide theme presets
  types.ts                — Slide types + helpers (slideStepCount, getActiveFocusRegion)
  schema.ts (in src/lib/) — Zod validation for JSON deck import
  ScaledSlide.tsx         — fixed 1920×1080 fit-and-scale wrapper
  CameraStage.tsx         — per-slide focus-region zoom (composes with ScaledSlide)
  SlideTransition.tsx     — fade by default; opt-in camera-zoom for hero slides
  RenderSlide.tsx         — type dispatcher → widget
  controls/               — pills, overlays, toolbars
  widgets/                — per-slide-type renderers (poll, qa, embed)
```

## Audience / Live Polls

`/audience/:sessionId` is a phone-friendly companion. The presenter and the
audience use a same-origin `BroadcastChannel` named
`slides-audience-${sessionId}`. Messages:

- `presenter:slide` — broadcast on every slide/step change
- `audience:hello`  — sent on audience join → presenter re-broadcasts current slide
- `audience:vote`   — option index + voter id (dedupes re-votes)

**Limitation:** `BroadcastChannel` is same-browser only. For real cross-device
polling, swap the channel module for Lovable Cloud realtime — `audience-store`
and the message contract above are the integration surface; no UI changes
needed.

## Export Commands

- `downloadRehearsalReport(deckTitle?)` — `exportRehearsal.ts`
- `downloadAnnotations()` — `exportAnnotations.ts`

Both write JSON via the browser-native download path; no server roundtrip.

## Tests

`bunx vitest run` — covers `slideStepCount`, `getDisplayNumber`,
`getActiveFocusRegion`, `formatDuration`, and `classifyDrift`. Extend by
adding `*.test.ts` next to the module under test.
