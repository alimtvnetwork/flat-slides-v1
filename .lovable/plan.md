# Plan

## Active

### B19 — Lint & CI polish
- ⏳ theme-token contrast rule
- ⏳ deck export-zip CLI (deck + assets)
- ⏳ CI workflow (GitHub Actions running `lint-deck.ts`)
- ⏳ per-slide `sound` schema validation
- ⏳ LintPanel "Copy as JSON" button

## Completed

### B18 (partial — 6/10)
- ✅ Audio overhaul (HTMLAudioElement, stop-before-play, public/sounds/)
- ✅ Whoosh → fade_swoosh_v4 for slide jumps
- ✅ Zoom sound for step transitions + milestone clicks
- ✅ Settings → background-color now overrides `--slide-bg`
- ✅ `.hl` text-shadow spec applied (crisp ink-stamp)
- ✅ Clickable StepsSlide rows + TimelineSlide milestones
- ✅ LintPanel severity filter + group-by-slide
- ✅ `lint-deck.ts` glob support
- ✅ music-url-not-https + music-volume-out-of-range rules
- ✅ Fullscreen overflow fix on `SlideTransition`

### B17
- ✅ 9 advanced lint rules + CLI `--json`

### B16
- ✅ Lint foundation + LintPanel
