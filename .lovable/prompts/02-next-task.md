# 02 — Next Task (v5)

> Iteration counter for the "Next N steps" workflow. Bump the heading on
> each invocation (e.g. `next task 7`) so chat-history search can locate
> the exact batch.

**Latest invocation:** `next task 20` → v1.16.0 (schema-versioned persist payload + `migrate` log in `useDeck` store; stale payloads now drop with a visible `[slides:persist] dropping vN payload` warning instead of crash-loading).

## What I want

1. Give me the **NEXT N STEPS — exactly N** — and for each one:
   1a) **Reasoning** — why this step, why now, what breaks if it's skipped.
   1b) **Time estimate** — realistic, not optimistic.
   1c) **What it unblocks** — the next thing that becomes possible.

2. Then list **every remaining item** after those N so I can see the full
   picture. At the end of the task always bump the minor version, add a
   changelog entry, update the release notes, and pin that version in the
   root `README.md`. Also save this prompt in `.lovable/prompts/` as
   `xx-next-task.md` and update the heading as `next task <number>`.

## Definition of done (non-negotiable)

You are NOT done until all of these are true:
- [ ] Relevant files AND project memories actually read — exact files/functions/lines named.
- [ ] **Root cause** written in ONE sentence, before any fix.
- [ ] Fix is the **minimum correct change** tied to that root cause — not a symptom patch.
- [ ] **Verified**: build output, error logs, and/or preview — before/after signal shown.
- [ ] Reported what changed and why.

## Hard rules

- STOP and read first. No skimming, no guessing from filenames.
- Root cause before fix. Trace end-to-end. No assumptions.
- No symptom-patching (try/catch hiders, fallback values, re-render hacks).
- If unsure, SAY SO. Wrong-but-confident is worse than "I don't know yet."
- Go slow, critical, deep. Depth IS the job.

## Error logs & observability

- Read actual error logs FIRST — console, server/worker, build output, stack traces.
- No logs = add logging at entry; never swallow.
- Every fix includes proper error handling + observability.
- Confirm the log line actually fires post-fix.

## Additional instructions

1. **Coding tasks**: follow `.lovable/coding-guidelines.md` + any file under `spec/coding-guidelines/`.
2. **SEO tasks**: follow `.lovable/seo-guidelines.md`.
3. Verify the guideline file exists first; skip silently if missing.
   Folder-level spec wins on conflict and the conflict must be called out.
