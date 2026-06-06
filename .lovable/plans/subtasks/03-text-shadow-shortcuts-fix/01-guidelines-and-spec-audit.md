# Guidelines and spec audit before code changes

**Slug:** guidelines-and-spec-audit
**Status:** pending
**Created:** 2026-06-06
**Parent:** 03-text-shadow-shortcuts-fix

## Scope

Before touching code, read and reconcile the applicable guidance sources for this coding task.

## Required reads

- `.lovable/coding-guidelines.md`
- Any existing `spec/coding-guidelines/**/*.md`
- Any existing `coding-guidelines/**/*.md` at repo root
- Any error-management folder under `spec/` or `coding-guidelines/` matching the user’s rule
- `.lovable/memory/decisions/02-highlight-text-shadow.md`
- `.lovable/memory/specs/02-text-shadow-highlight.md`
- `.lovable/memory/features/01-presenter-controller-pill.md`
- `spec/old-slides/camera-2026/03-shortcuts-and-controls.md`
- Current shortcut and presenter implementation files touched by the fix

## Output

Record the one-sentence root cause before implementation and call out any conflicts between guideline sources, preferring the more specific source.