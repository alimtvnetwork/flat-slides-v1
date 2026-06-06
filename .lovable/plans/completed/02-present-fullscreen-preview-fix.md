# Plan: Present/F preview fullscreen fix

## Context

- RCA: `.lovable/memory/diagnostics/06-present-fullscreen-preview-rca.md`
- User requirement: slides are first, Present button and `F` must present/fullscreen reliably.

## Steps

1. Change `enterFullscreen` so embedded windows open the presenter window before native fullscreen.
2. Keep the controller mounted while fullscreen is active so the fullscreen/minimize control remains visible.
3. Update fullscreen tests to assert embedded-first fallback and top-level native behavior.