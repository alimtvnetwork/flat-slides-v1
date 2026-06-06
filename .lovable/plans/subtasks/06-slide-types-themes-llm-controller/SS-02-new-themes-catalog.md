# SS-02 — New theme palettes (Phase A spec)

**Parent:** 06-slide-types-themes-llm-controller
**Slug:** new-themes-catalog
**Status:** pending
**Created:** 2026-06-06

Add the following themes to `src/slides/themes.ts` and the `theme` enum in
`deck.schema.json`. Each palette is sourced from `assets/samples/*` per
command 08, or from a well-known editor/brand reference.

| id              | accent     | text/cream | mood / source |
|-----------------|------------|------------|---------------|
| `sample-warm`   | from 01    | cream      | from `assets/samples/01-sample.webp` |
| `sample-cool`   | from 02    | off-white  | from `assets/samples/02-sample.webp` |
| `sample-editorial` | from 03 | ink        | from `assets/samples/03-sample.jpg`  |
| `midnight-indigo` | `#4f46e5` | `#e8ecf8` | navy + indigo accents |
| `ember-charcoal`  | `#e85d3a` | `#f0d78c` | dark charcoal + ember |
| `arctic-frost`    | `#2e6b8a` | `#0c1d2a` | icy blue (LIGHT theme) |
| `forest-moss`     | `#a0c49d` | `#f5f5f0` | deep green |
| `cherry-blossom`  | `#e88aab` | `#1a0a14` | pink on near-black |
| `paper-ink`       | `#0d0d0d` | `#f5f3ee` | LIGHT theme, Swiss editorial |
| `vapor-chrome`    | `#67e8f9` | `#1a1530` | iridescent / Y2K |

## Per-theme requirements
- HSL tokens only (no raw hex in components).
- Source-comment in `themes.ts` citing sample image filename.
- Both dark and at least two light themes shipped.
- All themes pass the existing theme-swap acceptance (run swap, no flash).

## Schema + docs
- Append every new id to the `theme` enum in `deck.schema.json`.
- Document in `docs/slides/spec/theme-json-guideline.md` and mirror to
  `public/docs/theme-json-guideline.md`.
- Update `spec/old-slides/21-slides-system/07-theme-system.md`.
