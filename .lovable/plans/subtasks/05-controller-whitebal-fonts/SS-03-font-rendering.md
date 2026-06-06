# SS-03 — Fix heading font weight + anti-aliasing

**Parent:** 05-controller-whitebal-fonts
**Slug:** font-rendering
**Status:** pending
**Created:** 2026-06-06

## Root cause hypothesis
- Ubuntu is loaded but only at weight 400; headings asking for `font-weight: 700` fall back to faux-bold of 400 which looks blurry.
- `src/styles.css` lacks global `-webkit-font-smoothing: antialiased` and `text-rendering: optimizeLegibility` on the slide canvas.
- `RenderSlide.tsx` title may use `font-weight: 400` (per earlier change) instead of bold.

## Fix
1. In `index.html` (or the Google Fonts `<link>`), ensure Ubuntu is requested with weights `400;500;700` and Poppins `400;500;600;700`.
2. In `src/styles.css`:
   ```css
   html, body, .slide-canvas {
     -webkit-font-smoothing: antialiased;
     -moz-osx-font-smoothing: grayscale;
     text-rendering: optimizeLegibility;
     font-feature-settings: "kern" 1;
   }
   ```
   Restore `--slide-title-weight: 700` and apply via `font-weight: var(--slide-title-weight)`.
3. In `RenderSlide.tsx` title element, use `font-family: var(--font-display)` (Ubuntu) and `font-weight: 700`; subtitle stays 400/500.
4. Verify no `font-weight: 400` override remains on headings from prior commits.

## Verification
- Inspect a title element in DevTools → Computed: `font-family: Ubuntu`, `font-weight: 700`, `-webkit-font-smoothing: antialiased`.
- Visual check at 1920x1080 fullscreen: heading strokes are crisp, clearly bold.
- Compare with screenshot from issue.
