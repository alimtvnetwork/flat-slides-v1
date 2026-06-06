# Glasswing — JSON-driven slide system

**Version:** `1.21.0` (pinned) · See [CHANGELOG.md](./CHANGELOG.md) for release notes.


A presentation engine where every deck is a JSON file. Three themes,
six slide layouts, four transitions, full keyboard navigation,
and import/export at both deck and single-slide granularity.

Any LLM can author a deck — feed it `slides/README-LLM.md` and a
topic, drop the output into **Settings → Import deck**.

---

## For the AI agent — read this first

If you are an AI assistant resuming work on this project, load these in order:

1. [`.lovable/what-to-read.md`](./.lovable/what-to-read.md) — full onboarding map (folder structure, conventions, how to add features/tests/specs).
2. [`.lovable/coding-guidelines.md`](./.lovable/coding-guidelines.md) — hard coding rules.
3. [`.lovable/strictly-avoid.md`](./.lovable/strictly-avoid.md) — things never to do.
4. [`.lovable/plan.md`](./.lovable/plan.md) — active roadmap (current = B19).
5. [`.lovable/memory/index.md`](./.lovable/memory/index.md) — decisions, specs, avoid-list.
6. [`.lovable/todo-tasks.md`](./.lovable/todo-tasks.md) — batch/step status.
7. [`.lovable/prompts/index.md`](./.lovable/prompts/index.md) — reusable prompt registry (e.g. `write memory`).

### Folder map

```
.lovable/
├── what-to-read.md          # onboarding map (start here)
├── coding-guidelines.md     # hard rules for any code change
├── strictly-avoid.md        # forbidden patterns
├── plan.md                  # single-file roadmap
├── suggestions.md           # tracker
├── suggestions/             # verbatim per-suggestion captures
├── prompts/                 # reusable prompts + index.md
├── memory/
│   ├── index.md             # MASTER INDEX
│   ├── workflow/            # current batch state
│   ├── decisions/           # architectural decisions
│   ├── specs/               # verbatim user specs
│   └── avoid/               # do-not-do rules
├── pending-issues/          # open issues, one file each
├── solved-issues/           # resolved issues with ## Solution
├── cicd-issues/             # CI/CD failures
└── cicd-index.md            # CI/CD summary
```

### Workflow for the AI

- **Add a feature** → read `what-to-read.md` §3.2 + `coding-guidelines.md`, update `plan.md` and `memory/workflow/`.
- **Add a unit test** → `what-to-read.md` §3.3 (Vitest, co-located `*.test.ts(x)`).
- **Add a spec** → save verbatim user spec to `.lovable/memory/specs/XX-slug.md` and link from `memory/index.md`; if it changes the roadmap, also update `plan.md`.
- **Resolve an issue** → move file from `pending-issues/` to `solved-issues/` and append `## Solution`, `## Learning`, `## What NOT to Repeat`.
- **End of session** → run the `write memory` prompt at `.lovable/prompts/01-write-memory.md`.

Never write to `mem://` directly — all persistent notes live under `.lovable/` or `spec/`.

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

Run browser smoke tests with `bun run test:e2e`. The script first launches a
Chromium preflight and prints the missing host library if the browser image is
not ready; use `bunx playwright install --with-deps chromium` in normal Linux
environments before rerunning.

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
- [`.lovable/what-to-read.md`](./.lovable/what-to-read.md) — **AI onboarding map (read first)**
- [`.lovable/todo-tasks.md`](./.lovable/todo-tasks.md) — active roadmap / step status

---

## For AI agents (Lovable / Claude / etc.)

Before touching this codebase, read these in order:

1. **`.lovable/what-to-read.md`** — full onboarding map: folder structure, which files to load, how to add features, tests, specs, and styling rules.
2. **`README.md`** (this file) — product overview and stack.
3. **`spec/SPEC.md`** + **`spec/IMPLEMENTATION_PLAN.md`** — what we are building and how.
4. **`.lovable/todo-tasks.md`** — current step batch and remaining work.
5. **`src/routes/README.md`** — TanStack Start routing conventions.

### Working on the project

| Task                  | Where it lives                                  |
| --------------------- | ----------------------------------------------- |
| Add a route           | `src/routes/*.tsx` (filename ↔ URL; never edit `routeTree.gen.ts`) |
| Add a UI component    | `src/components/` — small, reusable, token-driven |
| Add server logic      | `src/lib/*.functions.ts` via `createServerFn`   |
| Add a hook            | `src/hooks/`                                    |
| Add styling tokens    | `src/styles.css` (oklch, semantic names)        |
| Add a unit test       | `*.test.ts(x)` next to the unit; `bunx vitest run` |
| Add a spec            | `spec/XX-topic.md`, link from `spec/README.md`  |
| Add a slide deck      | `slides/decks/*.deck.json` (validated by Zod)   |
| Track new tasks       | Append to `.lovable/todo-tasks.md`              |

### Hard rules

- Never edit `src/routeTree.gen.ts` — auto-generated.
- Never hardcode colors — use tokens in `src/styles.css`.
- Never delete history from `.lovable/todo-tasks.md`; mark items done.
- Never store project notes in `mem://` — use `.lovable/` or `spec/`.

---

## Stack

TanStack Start (React 19, Vite 7), Tailwind v4, Zustand, Zod, Motion, Sonner.

---

**Version 1.0.0** — first stable cut.

