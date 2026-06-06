# spec/issues — Bug RCAs

Each file is a self-contained root-cause analysis (RCA) + fix plan + acceptance
criteria for one defect. Status is updated when the fix lands.

| # | File | Title | Status | Regression test |
|---|------|-------|--------|-----------------|
| 001 | [`001-preview-iframe-fullscreen.md`](./001-preview-iframe-fullscreen.md) | Present-from-preview-iframe is silently unsupported (no popup fallback) | open | `fullscreenTarget.test.ts` (to extend) |
| 002 | [`002-step-transition-black-flash.md`](./002-step-transition-black-flash.md) | Slide-4 step→step shows a black flash instead of a text crossfade | open | `step-transition-no-black.test.tsx` (to add) |

## Conventions

- One issue per file. Filename `NNN-short-slug.md`, 3-digit zero-padded.
- Sections in order: **Symptom**, **Repro**, **Investigation**, **Root cause**,
  **Fix plan**, **Acceptance**, **Regression test**, **Status log**.
- Update the table above and the file's **Status log** when status changes
  (`open` → `in-progress` → `fixed`).
- Link the regression test from both the table and the file body so anyone
  can verify the lock without re-deriving the RCA.
