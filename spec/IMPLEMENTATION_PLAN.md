# Glasswing Implementation Plan — 100 Steps

The "what got built" map. Each step is a single, reviewable unit with a file
target and a one-line acceptance check. Read alongside `spec/SPEC.md`.

---

## Phase 1 — Foundation (1–10)

1. **Type model** — `src/components/slides/types.ts` defines `Slide`, `Deck`, `DeckSettings`, `TransitionKind`, `TextPosition`, `RichText`, `Highlight`. ✅ Six slide types.
2. **9-cell TextPosition grid** — `top|center|bottom × left|center|right`. ✅
3. **RichText primitives** — strings interleaved with `{text, pill?}` chips. ✅
4. **Deck shape** — `{id, title, themeId?, version?, slides, settings}`. ✅
5. **Zustand store** — `useDeck` w/ `setSettings`, `setThemeId`, `setDeck`, `addSlide`, `upsertSlide`, `removeSlide`, `setLastVisited`. ✅
6. **Persistence** — `zustand/middleware/persist`, key `slides-deck-v1`, `partialize` strips UI state. ✅
7. **Seed deck** — 6 demo slides covering every type. ✅
8. **Slide engine tokens** — `src/styles.css` defines `--slide-bg`, `--slide-fg`, `--slide-hl`, font tokens. ✅
9. **1920×1080 canvas + ScaledSlide** — `transform: scale(var(--scale))` from ResizeObserver. ✅
10. **Reduced-motion guard** — `@media (prefers-reduced-motion)` collapses anims. ✅

## Phase 2 — Themes (11–20)

11. **Theme interface** — `Theme {id, name, bg, fg, muted, hl, hlInk, fontHeading, fontBody, fontDisplay}`. ✅
12. **THEMES table** — `midnight | paper | sunset`. ✅
13. **`getTheme(id)`** — safe lookup, falls back to `midnight`. ✅
14. **`themeStyle(theme)`** — emits CSS-var inline style object. ✅
15. **`ThemeWrap`** — wraps each `RenderSlide` body so per-slide `themeId` overrides deck. ✅
16. **Deck-level theme** — `deck.themeId` stored separately + on deck. ✅
17. **Theme picker** — 3-card grid in SettingsDrawer with live swatches. ✅
18. **`DEFAULT_THEME_ID`** — exported for reset. ✅
19. **Theme reset on import** — `setDeck` adopts `deck.themeId ?? DEFAULT_THEME_ID`. ✅
20. **Token bleed** — `.slide-content` reads `--slide-bg/fg/muted/hl` so themes "just work". ✅

## Phase 3 — Slide types & positioning (21–35)

21. **`CenterSlide`** — display/heading + optional subhead, alignable. ✅
22. **`LeftSlide`** — kicker + heading + body + optional media. ✅
23. **`StepsSlide`** — progressive numbered reveal, `step` prop. ✅
24. **`QuoteSlide`** — large display quote + attribution. ✅
25. **`BulletsSlide`** — kicker + heading + 1–8 bullets w/ dot markers. ✅
26. **`ImageSlide`** — `fit: cover|contain|split`. ✅
27. **Split-image layout** — 50/50 with heading + caption beside. ✅
28. **Bullet markers** — accent-colored circle anchored to baseline. ✅
29. **`positionStyle()`** — translates `TextPosition` → flex justify/align + textAlign. ✅
30. **`padding` per slide** — overridable canvas padding (default 120 px). ✅
31. **`Rich` renderer** — `.hl` (text glow) vs `.hl-pill` (chip). ✅
32. **`\n` → `<br/>`** — preserved in plain-string parts of RichText. ✅
33. **Per-slide background** — CSS color or `url(...)`. ✅
34. **Per-slide theme** — `themeId` field. ✅
35. **Single entrypoint** — `<RenderSlide slide step />` dispatches by `slide.type`. ✅

## Phase 4 — Routing & nav (36–45)

36. **`/`** — landing with deck CTA + keyboard cheat-sheet. ✅
37. **`/slides`** — grid overview, links to each slide. ✅
38. **`/slides/$slideId`** — single slide view. ✅
39. **`/slides/$slideId/$step`** — step-coordinate route for `type:"steps"`. ✅
40. **`document.title` sync** — `${i+1}/${N} — ${title}`. ✅
41. **Keyboard nav** — `→/Space/Enter` next, `←` prev, `F5` fullscreen, `Esc` exit. ✅
42. **Step rollover** — `→` past last step → next slide. ✅
43. **Step back-roll** — `←` from step 0 → previous slide. ✅
44. **Last-visited tracking** — `setLastVisited` for grid → slide roundtrip. ✅
45. **404 fallback** — slide-not-found returns to `/slides`. ✅

## Phase 5 — Chrome & UX (46–55)

46. **`ControlBar`** — Prev / `N/Total` / Next / Share / Settings. ✅
47. **Editable counter** — double-click to jump. ✅
48. **Step indicator** — `· step 1/N` shown only on step routes. ✅
49. **Share button** — `navigator.share` w/ clipboard fallback. ✅
50. **`SettingsDrawer`** — slide-over panel, dismissable backdrop. ✅
51. **Theme card picker** — 3 themes w/ live swatches. ✅
52. **Background mode toggle** — color | image. ✅
53. **Native color picker + presets** — 6 preset swatches. ✅
54. **Darken/blur sliders** — 0–100 / 0–20. ✅
55. **Transition selector** — `<select>` over 4 kinds. ✅

## Phase 6 — Motion & audio (56–65)

56. **`SlideTransition`** — `AnimatePresence mode="wait"` on `transitionKey`. ✅
57. **`camera-zoom`** — `scale + translateZ + blur + rotateX`, 720 ms. ✅
58. **`morph`** — `scale 1.04 → 1`, 450 ms. ✅
59. **`fade`** — opacity + 12 px Y, 300 ms. ✅
60. **`eaten`** — exit shrinks + blurs + slides left. ✅
61. **3D perspective** — `--slide-perspective: 2400px` on stage. ✅
62. **`triggerWhoosh`** — fires on `camera-zoom` only. ✅
63. **Volume control** — slider 0–1, gated by `soundEnabled`. ✅
64. **Audio bypass** — reduced-motion skips whoosh. ✅
65. **Fullscreen API** — `useFullscreen` hook w/ enter/exit/listen. ✅

## Phase 7 — JSON I/O (66–80) ★ headline feature

66. **Folder layout** — `slides/decks/*.deck.json` + `*.slide.json`. ✅
67. **Zod schema** — `src/lib/slides/schema.ts` mirrors `types.ts`. ✅
68. **`DeckSchema` / `SlideSchema`** — discriminated union over `type`. ✅
69. **`SLIDE_SCHEMA_VERSION`** — exported constant, persisted on every export. ✅
70. **`exportDeck(deck)`** — downloads `${title}.deck.json`. ✅
71. **`exportSlide(slide)`** — downloads `${id}.slide.json`. ✅
72. **`parseDeckJson(raw)`** — Zod-validate, returns `{ok, value|error}`. ✅
73. **`parseSlideJson(raw)`** — same shape, single-slide. ✅
74. **`pickJsonFile()`** — hidden `<input type=file>` returning text, 5 MB cap. ✅
75. **Import deck flow** — Settings → button → file picker → `setDeck` → toast. ✅
76. **Import slide flow** — Settings → button → file picker → `upsertSlide` → toast. ✅
77. **Export single slide** — uses `currentSlideId` from route. ✅
78. **Error formatting** — first 4 Zod issues shown in toast for 8 s. ✅
79. **Demo deck** — `slides/decks/demo.deck.json` shipping in repo. ✅
80. **Example single slide** — `slides/decks/example.slide.json`. ✅

## Phase 8 — LLM authoring contract (81–90) ★ headline feature

81. **`slides/README-LLM.md`** — full spec doc, self-contained for any LLM. ✅
82. **File-shape table** — `.deck.json` vs `.slide.json`. ✅
83. **Identifier rules** — regex, max lengths, uniqueness. ✅
84. **Theme catalog** — names, bg, accent — pickable by `themeId`. ✅
85. **Settings reference** — every field documented. ✅
86. **Per-type slide examples** — six worked examples covering all types. ✅
87. **Positioning grid doc** — 9-cell ASCII map. ✅
88. **Rich-text doc** — strings + chips + `\n` rule. ✅
89. **Density rules** — bullet caps, paragraph length, "one idea per slide". ✅
90. **Prompt template** — turnkey prompt section at bottom of LLM doc. ✅

## Phase 9 — Docs, version, polish (91–100)

91. **Root `README.md`** — features, quickstart, JSON example, links. ✅
92. **Keyboard cheat-sheet** — surfaced on `/` and in README. ✅
93. **`package.json` → `version: 1.0.0`** — first stable cut. ✅
94. **`deck.version` migration plan** — bump `DECK_SCHEMA_VERSION` on breakage. ✅
95. **Persistence migration hook** — Zustand `persist` config ready for `version + migrate`. ✅
96. **`data-app-chrome`** — Settings backdrop tagged so `@media print` hides it. ✅
97. **Index page replaces placeholder** — no more `data-lovable-blank-page-placeholder`. ✅
98. **Slide bg falls through to theme** — `--slide-bg` token wins when no per-slide override. ✅
99. **Spec cross-references** — `SPEC.md` + `IMPLEMENTATION_PLAN.md` + `README-LLM.md` all linked from root README. ✅
100. **Tag `v1.0.0`** — version bumped; ready for release tag.

---

### Beyond v1 (parked for v1.1+)

- HTML / GIF / PDF export pipeline (see `spec/SPEC.md` §I).
- Drag-and-drop slide reordering in `/slides` grid.
- Presenter view w/ next-slide preview + timer + BroadcastChannel sync.
- Per-slide layout-coordinate freeform editor (vs `align` 9-grid).
- Migration runner when `DECK_SCHEMA_VERSION` advances past 1.
