# 021 — BroadcastChannel listeners accumulate on each slide navigation

**Status:** open
**Area:** audience-store

## Symptom

Long sessions show ballooning memory + duplicate sync messages.

## Root cause

`audience-store.subscribe()` is called in a `useEffect` that lacks a stable cleanup; route remounts create a new channel each time.

## Fix plan

1. Move channel creation to module scope (singleton). 2. Provide an `unmountAll` test helper. 3. Add a Vitest test that mounts/unmounts the route 100× and asserts a stable channel count.

## Acceptance

- Behavior described in **Symptom** no longer reproduces.
- A regression test from **Fix plan** is added and passes locally.
- Any spec doc referenced in **Fix plan** is created/updated in the same change.

## Status log

- 2026-06-06 — opened. RCA + fix plan ready. No code changes yet (per user request — fixes deferred).
