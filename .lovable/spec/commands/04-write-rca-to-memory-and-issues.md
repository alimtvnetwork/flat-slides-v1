# Command: Write RCA to memory AND issues for every user-reported regression

**Status:** active
**Created:** 2026-06-06

## Command verbatim

> "I want you to write the root cause analysis. I mean, why it was not updating before. ... I want you to write the root cause analysis into the memory and why it happened, how it happened, into the issues as well, so that I could share with any other AI in the future so that they do not make this mistake."

## Scope

Applies to every user-reported regression / bug that is fixed. Two artifacts are required:

1. `.lovable/memory/diagnostics/NN-<slug>-rca.md` — durable RCA: what broke, why it broke, how it was missed, how future AI must avoid it.
2. Append the same RCA summary to the matching `.lovable/issues/NN-<slug>.md` so the issue file is shareable on its own.

## When it applies

Any planning or implementation turn that resolves a user-reported regression. RCA must be written BEFORE the issue is moved to `solved-issues/` or the plan is moved to `completed/`.
