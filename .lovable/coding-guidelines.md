# Coding Guidelines

> Read before writing any code. Also read: `spec/`, `spec/error-manage/` (if present),
> language-specific guidelines, Boolean guidelines, Enum guidelines, error-management guidelines.

1. Functions ≤ 8 lines where practical.
2. No nested ifs — prefer early returns / guard clauses.
3. Ifs stay simple — prefer positive conditions, avoid negatives.
4. Boolean names prefixed `is` or `has`; no negative names (`isNotReady` ❌).
5. Use proper types — never `any` / `unknown` / wide-open. `Generic<T>` is fine.
6. Never swallow errors — every `catch` logs.
7. No file > ~100 lines without justification; split into modules.
8. No magic strings or numbers — use enums or constants.
9. Definitions live in their own files, not inline.
10. Reusability first — keep code DRY.
11. React components: small, composable. For complex trees, mermaid-diagram in the plan first.
12. If `spec/error-manage/` exists, every error handler must follow it.
13. Prefer immutable, single-assignment variables. Mutate only where required.
14. Assets in `assets/XX-folder/XX-file.<ext>` with numeric prefixes.
15. Enums and constants in dedicated files.
16. Slides: use design tokens from `src/styles.css` (oklch). Never hardcode colors.
17. Server logic → `src/lib/*.functions.ts` via `createServerFn`. Never put protected fns in public-route loaders.
18. Test with `bunx vitest run`. Co-locate `*.test.ts(x)`.
