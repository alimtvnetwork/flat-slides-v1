# Current Batch State

## ✅ Done (recent sessions)
- B16 — lint rules foundation
- B17 — 9 advanced lint rules (focus-rect, volume, duplicate-title, padding, budget, background-not-https, embed-missing-url, left-media-alt-missing) + CLI `--json`
- B18 (partial, 6/10) — audio overhaul, `.hl` text-shadow fix, step clicks, LintPanel severity filter + group-by-slide, glob CLI, music-url-not-https + music-volume-out-of-range rules

## 🔥 Current priority before B19
B19A — repair settings/fullscreen/camera based on RCA:
1. ✅ unify slide background rendering pipeline (ThemeWrap owns bg; SlideLayout no longer paints)
2. ✅ wire darken + blur controls (bg layer + dark overlay in ThemeWrap)
3. ✅ separate transition zoom from camera/focus zoom (allowZoom gated by `focus?.length === 0`)
4. ✅ fix 1-based step focus indexing (CameraStage now gets `stepNum + 1`)
5. ✅ harden fullscreen stage clipping (`.slide-wrapper` overflow:hidden + isolation + contain)
6. ✅ add proposal example with right-side image (`sajida-visual` seed slide)
7. ✅ add camera/focus-region example (`focus-demo` steps slide w/ per-step rects)
8. ✅ update RCA memory — all 6 root causes resolved & noted


## ✅ Pending B19 — ALL DONE
1. ✅ theme-token contrast rule (WCAG AA on fg/bg + hl/hlInk per theme)
2. ✅ deck export-zip CLI (`scripts/export-deck.ts` — bundles deck + local /public assets via `zip`)
3. ✅ CI workflow wiring (`.github/workflows/ci.yml`: bun install + lint + vitest)
4. ✅ per-slide `sound` schema validation (url + volume; 3 rules + 3 tests)
5. ✅ LintPanel "Copy as JSON" button (filtered issues → clipboard)

## 🚫 Blocked
- None.

## Next session resume point
B19 + B19A both fully shipped. 61/61 tests pass. Next batch can start fresh — possible directions: speaker-notes inspector, PDF export of the deck, or richer presenter mode.
