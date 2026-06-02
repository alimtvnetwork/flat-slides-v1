# What To Read — AI Onboarding Map

> Read this FIRST in every new session. It tells the AI which files to load
> to understand the project, follow conventions, and ship safe changes.

## 1. Project orientation (read in order)

1. `README.md` — top-level project overview, scripts, conventions.
2. `.lovable/what-to-read.md` — this file (you are here).
3. `.lovable/project.json` — Lovable project metadata.
4. `.lovable/todo-tasks.md` — active roadmap / batch status.
5. `spec/SPEC.md` — product spec (what we are building).
6. `spec/IMPLEMENTATION_PLAN.md` — how it is being built.
7. `spec/README.md` — spec index and sample assets.

## 2. Code layout

```
src/
├── routes/         # TanStack Start file-based routes
│   ├── __root.tsx          # root layout (html/head/body, providers)
│   ├── index.tsx           # /
│   ├── slides.tsx          # /slides layout
│   ├── slides.$slideId.tsx # /slides/:slideId
│   └── slides.$slideId.$step.tsx
├── components/
│   ├── slides/     # slide rendering, controls, present mode
│   └── ui/         # shadcn primitives (do not hand-edit; use shadcn--add)
├── hooks/          # reusable React hooks
├── lib/            # pure utilities, *.functions.ts server fns
├── router.tsx      # router instance + QueryClient context
├── start.ts        # createStart + global middleware
├── server.ts       # SSR entry
├── styles.css      # Tailwind v4 + design tokens (oklch)
└── routeTree.gen.ts  # AUTO-GENERATED — never edit by hand
```

Other top-level:
- `assets/` — static design assets, numbered.
- `slides/` — slide JSON content.
- `spec/` — product/engineering specs and reference images.
- `.lovable/` — agent memory, prompts, plans (see §4).

## 3. How the AI should work on this project

### 3.1 Before writing code
- Read this file + `README.md` + `spec/SPEC.md`.
- Read `.lovable/todo-tasks.md` for active step list.
- Check `src/routes/README.md` for routing rules.
- For UI: scan `src/styles.css` for tokens; never hardcode colors.

### 3.2 Adding a feature
1. Confirm scope vs current step in `.lovable/todo-tasks.md`.
2. If touching a route: filename ↔ `createFileRoute` path must match
   (dots become slashes; never edit `routeTree.gen.ts`).
3. Keep components small; prefer composition; reuse `src/components/ui/*`.
4. Server logic → `src/lib/*.functions.ts` via `createServerFn`.
5. Update `.lovable/todo-tasks.md` (mark `✅` / `⏳`).

### 3.3 Adding a unit test
- Use `bunx vitest run` (Vitest preconfigured).
- Co-locate tests as `*.test.ts(x)` next to the unit under test
  (e.g. `src/lib/foo.ts` → `src/lib/foo.test.ts`).
- Mock server fns at the module boundary, not the network.
- Snapshot only deterministic output.

### 3.4 Adding/refining a spec
- Add to `spec/` as `XX-topic.md` (numeric prefix).
- Link from `spec/README.md`.
- If it changes the roadmap, update `.lovable/todo-tasks.md`.

### 3.5 Styling
- Tokens live in `src/styles.css` (oklch). Add new tokens there.
- Slide typography classes: `.slide-display`, `.slide-heading`,
  `.slide-kicker`, `.slide-chrome` (already bold, Ubuntu).
- Never write `text-white`/`bg-black` — use semantic classes.

### 3.6 Verifying
- Build runs automatically — do not run `tsc` or `npm run build` manually.
- Use console/network/preview tools to verify before claiming a fix.

## 4. `.lovable/` memory layout

```
.lovable/
├── project.json         # project metadata
├── what-to-read.md      # THIS FILE — onboarding map
├── todo-tasks.md        # active step roadmap
```

When the user triggers a full memory write (`write memory` /
`end memory`), expand this tree per the prompt at
`.lovable/prompts/01-write-memory.md` (create it on first trigger).

## 5. Hard rules

- Never edit `src/routeTree.gen.ts`.
- Never write to `mem://` directly — all persistent project notes live
  under `.lovable/` or `spec/`.
- Never delete history from `.lovable/todo-tasks.md`; mark items done.
- Never bypass design tokens.
- Never commit Supabase service-role keys to client code.

## 6. Quick command reference

| Task              | Command                          |
| ----------------- | -------------------------------- |
| Install dep       | `bun add <pkg>`                  |
| Run a test        | `bunx vitest run <path>`         |
| Add shadcn comp   | use `shadcn--add` tool           |
| Inspect dev logs  | `tail -n 200 /tmp/dev-server-logs/dev-server.log` |
