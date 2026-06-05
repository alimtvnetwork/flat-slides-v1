# Memory Index

> Master index of `.lovable/memory/`. Every file under this tree must be listed here.

## Workflow
- [01-current-batch.md](workflow/01-current-batch.md) — active batch status (B16–B18 shipped, B19A settings/fullscreen/camera repair queued before B19 lint polish)

## Diagnostics
- [01-slide-settings-fullscreen-camera-rca.md](diagnostics/01-slide-settings-fullscreen-camera-rca.md) — RCA for settings not applying, darken/blur no-op, fullscreen zoom escape, camera focus indexing, and proposal example gaps
- [02-fullscreen-and-settings-rca.md](diagnostics/02-fullscreen-and-settings-rca.md) — B21 controller batch (steps 1–28): persistent PresenterShell, 4-anchor controller pill (`riseup.controller.anchor`, `B` shortcut), hover-reveal with reduced-motion support, overflow menu <1280px, single keymap via `presenterActions.ts` + `SHORTCUTS` parity test, e2e happy path

## Decisions
- [01-audio-system.md](decisions/01-audio-system.md) — HTMLAudioElement stop-before-play; whoosh/zoom/click mapping
- [02-highlight-text-shadow.md](decisions/02-highlight-text-shadow.md) — `.hl` uses crisp `rgb(0 0 0) 1px 0.7px 0px` ink-stamp; no glow
- [03-settings-background-color.md](decisions/03-settings-background-color.md) — initial `ThemeWrap` override was incomplete; see diagnostics RCA before changing settings/background behavior
- [04-slide-step-clicks.md](decisions/04-slide-step-clicks.md) — StepsSlide rows + TimelineSlide milestones are click-targets via `useStepJump`

## Specs
- [01-coding-icons-decor.md](specs/01-coding-icons-decor.md) — VSCode/JetBrains/AWS/Azure/AI faded icon decor spec
- [02-text-shadow-highlight.md](specs/02-text-shadow-highlight.md) — verbatim user spec for `.hl` text-shadow
- [03-audio-mapping.md](specs/03-audio-mapping.md) — verbatim spec: fade_swoosh_v4 for slide jumps, zoom for step transitions

## Avoid
- [01-no-camera-zoom-default.md](avoid/01-no-camera-zoom-default.md) — never default to camera-zoom on lists/steps/timeline
- [02-no-hl-glow.md](avoid/02-no-hl-glow.md) — never add blur/glow layers to `.hl`
