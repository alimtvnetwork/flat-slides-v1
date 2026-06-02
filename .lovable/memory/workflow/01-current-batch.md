# Current Batch State

## ✅ Done (recent sessions)
- B16 — lint rules foundation
- B17 — 9 advanced lint rules (focus-rect, volume, duplicate-title, padding, budget, background-not-https, embed-missing-url, left-media-alt-missing) + CLI `--json`
- B18 (partial, 6/10) — audio overhaul, `.hl` text-shadow fix, step clicks, LintPanel severity filter + group-by-slide, glob CLI, music-url-not-https + music-volume-out-of-range rules

## 🔥 Current priority before B19
B19A — repair settings/fullscreen/camera based on RCA:
1. unify slide background rendering pipeline
2. wire darken + blur controls
3. separate transition zoom from camera/focus zoom
4. fix 1-based step focus indexing
5. harden fullscreen stage clipping
6. add proposal example with right-side image
7. add camera/focus-region example
8. update RCA memory after implementation + validation

## ⏳ Pending (B19 lint/CI candidates after B19A)
1. theme-token contrast rule (low-contrast `themeId` overrides)
2. deck export-zip CLI (deck + assets bundle)
3. CI workflow wiring (GitHub Actions)
4. per-slide `sound` schema validation
5. LintPanel "Copy as JSON" button

## 🚫 Blocked
- Implementation is waiting for the user's next instruction after the RCA/task list.

## Next session resume point
If the user says to proceed, implement B19A tasks in order, then validate fullscreen/settings/camera behavior before returning to B19 lint/CI polish.
