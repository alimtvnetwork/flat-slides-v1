# Current Batch State

## ✅ Shipped batches
- B16 — lint rules foundation
- B17 — 9 advanced lint rules + CLI `--json`
- B18 (partial 6/10) — audio overhaul, `.hl` text-shadow, step clicks, LintPanel severity filter + group-by-slide, glob CLI, music-url-not-https + music-volume-out-of-range
- B19 / B19A — settings/fullscreen/camera repair + theme contrast + export-zip + CI + per-slide `sound` schema + LintPanel Copy-as-JSON
- **B21 (steps 1–30)** — Fullscreen, Settings, Music, Controller hardening. See `.lovable/memory/diagnostics/02-fullscreen-and-settings-rca.md` and `features/01-presenter-controller-pill.md`.

## B21 highlights
- PresenterShell hoisted into `slides.$slideId.tsx` (survives route-param nav).
- Music: deck-level `settings.music` + per-slide `slide.sound.music` override; volume clamped via `musicVolume.ts`.
- Controller: 4 anchors (`bottom-center | bottom-right | bottom-left | top-right`), persisted under `riseup.controller.anchor`; cycle via right-click or `B`.
- Hover-reveal collapsed state (160ms expand / 400ms grace), zeroed under `prefers-reduced-motion`.
- Overflow menu collapses Settings/Help behind `More controls` below 1280px.
- Single keymap: SHORTCUTS entries carry stable `id`; side-effects live in `presenterActions.ts`; parity test fails the build on drift.
- Playwright happy-path spec for controller (`e2e/controller-happy-path.spec.ts`).

## ✅ B21 complete (30/30)
- Step 30 — pending-issues sweep done. `.lovable/pending-issues/index.md` now has a "Presenter controller pill (B21)" section recording all shipped items. Only manual cross-browser validation remains (out of agent scope).

## 🚫 Blocked
- None.

## Next session resume point
B21 fully shipped. Future batches: speaker-notes inspector, richer presenter mode, manual cross-browser validation passes.

