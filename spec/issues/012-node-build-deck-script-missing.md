# 012 — There is no Node.js script that compiles deck JSON into a deployable bundle

**Status:** open
**Area:** build pipeline

## Symptom

User asked: “are the slides being compiled using Node.js from the JSON?” — today the JSON is parsed at runtime in the browser; there is no offline compile/validate step.

## Root cause

Decks live in the bundle as `import sampleDeckJson from '...?raw'` and are parsed in `SettingsDrawer.handleLoadSpecSample`. No CI step asserts the shipped JSON validates against the schema before deploy.

## Fix plan

1. Add `scripts/build-deck.ts` (Node) that reads `*.deck.json` from `content/decks/`, validates with `DeckSchema`, optionally renders preview PNGs, and emits a typed `src/generated/decks.ts`. 2. Wire into `package.json` as `bun run build:decks`. 3. Fail CI on any invalid deck. 4. Document in `docs/slides/spec/deck-build-pipeline.spec.md`.

## Acceptance

- Behavior described in **Symptom** no longer reproduces.
- A regression test from **Fix plan** is added and passes locally.
- Any spec doc referenced in **Fix plan** is created/updated in the same change.

## Status log

- 2026-06-06 — opened. RCA + fix plan ready. No code changes yet (per user request — fixes deferred).
