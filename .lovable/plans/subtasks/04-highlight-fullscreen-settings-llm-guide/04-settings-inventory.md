# Subtask 04 — Settings drawer inventory

**Slug:** settings-inventory
**Status:** pending
**Created:** 2026-06-06
**Parent:** 04-highlight-fullscreen-settings-llm-guide

## Scope

Identify the exact Settings drawer component, the persisted settings shape, and the insertion point for the new text-color + highlight-color pickers and the new Guide section.

## Checks

- Locate the Settings drawer file under `src/components/slides/` (likely `SlideSettingsDrawer.tsx` or similar).
- Identify the settings store + persistence key (likely `riseup.settings.*` in localStorage per memory conventions).
- Identify where the background color picker is rendered today — new pickers go directly after it, same control style.
- Identify a logical place for a "Guide" section (likely a new collapsible group at the bottom of the drawer).

## Output

File paths + line ranges for: (a) where to add the two new pickers, (b) where to extend the settings store shape, (c) where to add the Guide section.
