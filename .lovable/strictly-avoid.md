# Strictly Avoid

- **Camera-zoom as default transition:** user dislikes it; default is `fade`. See `.lovable/memory/avoid/01-no-camera-zoom-default.md`.
- **Glow / blur on `.hl`:** highlight uses a single crisp text-shadow only. See `.lovable/memory/avoid/02-no-hl-glow.md`.
- **Writing to `mem://` directly:** all persistent notes live under `.lovable/` or `spec/`.
- **Editing `src/routeTree.gen.ts`:** auto-generated.
- **Hardcoded colors in components (`text-white`, `bg-black`):** always use semantic tokens from `src/styles.css`.
