# RCA: Yellow highlight (`.hl`) renders invisible on light themes

## What was wrong

Keywords wrapped in `<span class="hl">` (emitted by `Rich.tsx` for `RichText` highlight parts) rendered with the correct text-shadow ink stamp but no visible yellow background. On light themes the inline run blended into the slide surface and the highlight feature looked unimplemented to the user.

## Root cause (one sentence)

The `.hl` rule in `src/styles.css` was set with the shorthand `background: ...` form (and at one point relied on a parent rule resetting `background`), so the highlight token never won the cascade — and there was no regression test asserting `background-color` actually resolves to the `--slide-hl` token.

## Files implicated

- `src/styles.css:230` — `.hl` selector body.
- `src/styles.css:153` — `--slide-hl` design token.
- `src/components/slides/Rich.tsx` — emits `<span class="hl">`.
- `src/components/slides/RenderSlide.tsx` — `ThemeWrap` now also forwards `settings.hlColor` onto `--slide-hl`.
- `src/components/slides/highlight-style-guardrails.test.ts` — new assertion locks the fix.

## Fix

1. `.hl` uses explicit `background-color: var(--slide-hl)` (not shorthand).
2. Settings drawer exposes a highlight-color picker that overrides `--slide-hl` per-deck.
3. Added a guardrail test that fails if `.hl` ever loses `background-color: var(--slide-hl)` or if the token is set to a transparent value.

## How verified

`bunx vitest run src/components/slides/highlight-style-guardrails.test.ts` → 3/3 green, including the new `background-color` regression.

## Do not regress

- Do not collapse `background-color` back into a `background:` shorthand on `.hl`.
- Do not remove the highlight-color override in `RenderSlide.ThemeWrap` — that is the contract the settings picker relies on.
- Do not set `--slide-hl` to a transparent / `rgba(...,0)` value in any theme.
