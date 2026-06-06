# Command: Write root-cause analysis into memory BEFORE implementing

**Slug:** write-rca-before-implementing
**Status:** active
**Created:** 2026-06-06
**Scope:** Every multi-step task, especially anything spanning >2 files.

## Verbatim

> "I will give you fifty steps to first write your root cause in your
> memory and things like that, and then you start fixing those. Okay?
> First writing, then implementing. Remember this."

## Rule

For any planned task with more than ~3 steps:

1. FIRST write the root-cause analysis (what is wrong today, why, which
   files are implicated, which prior decisions failed) into
   `.lovable/memory/diagnostics/NN-<slug>.md`.
2. THEN write the plan into `.lovable/plans/pending/XX-<slug>.md`.
3. ONLY THEN implement.

No diagnostic file → no implementation. Plan files MUST link to the
diagnostic file in their Context section.

## When it applies

Always. This is a permanent working convention.
