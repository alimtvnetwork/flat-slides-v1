# Text shadow enforcement

**Slug:** text-shadow-enforcement
**Status:** pending
**Created:** 2026-06-06
**Parent:** 03-text-shadow-shortcuts-fix

## Scope

Make the requested text shadow visible where slide highlights/text require it, without adding glow, blur, or multi-layer effects.

## Required checks

- Confirm the exact `.hl` rule in `src/styles.css`: `text-shadow: rgb(0 0 0) 1px 0.7px 0px;`.
- Trace whether slide rich text/highlight rendering actually emits `.hl` in the active deck.
- If the class is missing in slide output, fix the rendering path rather than changing the visual spec.
- Keep `.hl-pill` separate and do not add forbidden glow/blur shadows.

## Verification

Use tests or a browser/preview screenshot to confirm the active slide text visibly receives the crisp shadow and remains white where expected.