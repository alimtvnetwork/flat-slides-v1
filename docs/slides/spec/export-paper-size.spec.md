# Export paper-size selection

## Purpose

Let users choose the target page geometry for printable slide exports without creating separate export routes. The existing export routes remain the source of truth:

- `/slides/print`
- `/slides/handout`
- `/slides/handout-3up`

Each route accepts a `paper` query parameter and applies it to screen preview sizing and print sizing.

## Root cause

The current export implementation hard-codes `@page { size: 1920px 1080px landscape; margin: 0 }` and page elements at `1920px × 1080px`. That is correct for 16:9 PDF export, but it cannot produce Letter or A4 handouts without browser-side scaling/cropping in print dialogs.

## Requirements

1. Supported paper values:
   - `paper=wide` — 1920 × 1080 landscape, default/backward compatible.
   - `paper=letter` — 1100 × 850 landscape.
   - `paper=a4` — 1123 × 794 landscape.
2. Missing or unknown `paper` falls back to `wide`.
3. `?auto=1` behavior remains unchanged.
4. All three export routes set `data-paper="wide|letter|a4"` on the root export container.
5. CSS uses `data-paper` to set `--export-page-width` and `--export-page-height` for screen previews and print output.
6. `@page` rules use named pages so Wide, Letter, and A4 exports get their intended print geometry.
7. SettingsDrawer exposes export controls for Wide, Letter, and A4 for each existing export type.
8. CommandPalette keeps quick export commands as Wide/default export commands.
9. Tests cover query parsing/fallback and route-level data-paper application.

## Non-goals

- No portrait layouts.
- No new print routes.
- No browser-specific print-dialog automation beyond the existing `window.print()` trigger.
