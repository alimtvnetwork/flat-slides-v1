# 032 — Import deck accepts `.txt`, `.png`, anything — fails late with cryptic JSON error

**Status:** fixed
**Area:** pickJsonFile

## Symptom

User picks a `.txt` file; sees `Invalid JSON: Unexpected token <`.

## Root cause

`pickJsonFile` sets `accept='.json,application/json'` but the OS picker honors it loosely. No MIME or extension check after the fact.

## Fix plan

1. After read, check `file.name.endsWith('.json')` or `file.type === 'application/json'`; otherwise toast a friendly error before parsing.

## Acceptance

- Behavior described in **Symptom** no longer reproduces.
- A regression test from **Fix plan** is added and passes locally.
- Any spec doc referenced in **Fix plan** is created/updated in the same change.

## Status log

- 2026-06-06 — opened. RCA + fix plan ready. No code changes yet (per user request — fixes deferred).

- 2026-06-06 — locked with regression test `src/lib/slides/io-pickjsonfile.test.ts`. Status → fixed.
