# Command: Maximal plan enforcement

**Status:** active
**Created:** 2026-06-06

## Command verbatim

The user provided an **8 steps Plan, Maximal Enforcement (v6)** instruction requiring planning turns to write exactly the parsed step count to disk, avoid plan-approval tools, scan `.lovable/`, capture commands and issues, create subtasks for deep steps, and not execute implementation in the same turn.

## Scope

Applies whenever the user explicitly asks for a planning-only turn using this maximal-enforcement format or equivalent language.

## When it applies

- Parse the requested step count from the prompt header.
- Write plain markdown files under `.lovable/plans/pending/` with the required shape.
- Capture new command-style input under `.lovable/spec/commands/`.
- Capture reported bugs/regressions under `.lovable/issues/`.
- Do not call plan approval tools or ask for plan sign-off.
- Do not implement the plan in the same planning turn.