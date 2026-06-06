# Subtask 06 — Settings alignment with 27-slides-number spec

**Parent:** 01-slides-first-preview
**Slug:** settings-alignment
**Status:** completed in v1.12.0
**Created:** 2026-06-06

## Step 12 table

| Spec row | Current row | Action | Persistence key |
|---|---|---|---|
| Presenter Top Bar OFF by default, opt in via `J` | `PresenterTopBar` existed but was not mounted; `SettingsDrawer` had no row | Mounted surface in `SlidePresenterPage`; removed the `J` shortcut suppression; added Visibility row | `slides-chrome-v2.topJumperHidden` (state name preserves spec term) |
| Slide Number Badge ON by default | `SlideNumberBadge` mounted and persisted, no drawer row | Added Visibility row to toggle existing state | `slides-chrome-v2.slideNumberBadgeVisible` |
| Dot Pagination ON by default | `DotPagination` existed and state existed, but it was not mounted or exposed | Mounted surface in `SlidePresenterPage`; added Visibility row | `slides-chrome-v2.dotPaginationVisible` |
| Controller Indicator shown when controller pill is expanded | `SlideIndicator` renders inside `ControllerPill` expansion | No stateful toggle; added read-only row explaining expansion-owned visibility | n/a |
| Legacy Top Jumper OFF unless `?jumper=1` | Not implemented in current route tree | No-op for this pass; current top bar is the supported top-center surface | n/a |
| Grid Overview numbers only in grid | Existing `/slides` overview owns grid numbering | No-op | route-local |

Deviation: the spec does not require a separate tabbed settings route; v1.12.0 keeps the current single drawer and adds a `Visibility` section divider.
