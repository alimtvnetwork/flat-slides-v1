# Write Memory (a.k.a. "End Memory")

> **Purpose:** Persist everything the AI learned, did, decided, and left undone in this session — so the next AI session (which has full amnesia) can resume with zero context loss.

**Trigger phrases:** `write memory` · `end memory` · `update memory` · end of a task batch.

The canonical text of this prompt is the user-provided spec at chat batch B19. It governs `.lovable/` layout, file naming, audit phases, and anti-corruption rules. Key rules:

- Never write to `mem://` directly. All persistent notes go under `.lovable/`.
- Lowercase, hyphen-separated, numeric-prefixed filenames (`01-name.md`).
- Path is `.lovable/memory/` — never `memories/` (with `s`).
- Every new memory file is added to `.lovable/memory/index.md` in the same op.
- Never delete history — move done items to `## Completed`.
- Capture user specs verbatim under `.lovable/memory/specs/`.

See `.lovable/what-to-read.md` §4 for the canonical layout diagram.

## Changelog
- `v1` — initial enhanced version derived from the user's original "Write Memory" prompt.
