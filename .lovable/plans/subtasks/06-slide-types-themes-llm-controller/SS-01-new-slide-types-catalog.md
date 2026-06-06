# SS-01 — Catalog of new slide types (Phase A spec)

**Parent:** 06-slide-types-themes-llm-controller
**Slug:** new-slide-types-catalog
**Status:** pending
**Created:** 2026-06-06

Authoritative list of slide types to add in plan 06. Each entry lands as a
JSON-schema fragment + an LLM-guideline section + a renderer in
`src/components/slides/types/`. The user's brief calls for "image, SVG, GIF
and so on" — so coverage skews toward media-rich layouts.

## Types to add

### Media-driven
1. **ImageFullBleed** — single image fills the canvas, optional title/caption overlay with scrim.
2. **ImageSplit** — 50/50 image + text (left or right configurable).
3. **ImageGrid2x2** — four images, optional labels.
4. **ImageGrid3up** — three images in a row, captions below.
5. **ImageMasonry** — staggered 5–7 image collage.
6. **BeforeAfter** — two images with draggable slider (presenter mode only — static split in print).
7. **SvgIllustration** — inline SVG hero with title/eyebrow; supports multi-step focus reveals.
8. **AnimatedSvg** — same as SvgIllustration but with `<animate>` / CSS keyframe spec.
9. **GifLoop** — short GIF/APNG with looping caption row.
10. **VideoEmbed** — `<video>` muted autoplay loop (mp4/webm).
11. **LottiePlayer** — `.lottie` JSON player (loaded via lottie-web on demand).
12. **DiagramFocus** — large SVG diagram + step-by-step focus zooms (multi-step).
13. **DeviceMockup** — phone/desktop frame around a screenshot.
14. **MapPin** — SVG world/region map with pin annotations.

### Content / layout
15. **Quote** — large pull-quote, attribution row.
16. **TeamRoster** — N team profiles (avatar, name, role, link). Required by command 07.
17. **TeamSpotlight** — single hero teammate (large photo + bio).
18. **OrgChart** — simple boxes-and-lines hierarchy.
19. **FAQ** — Q/A pairs, optional accordion in fullscreen.
20. **PricingTable** — 2-4 plan columns with feature rows.
21. **StatGrid** — 3-6 oversized numbers with labels.
22. **KPIRow** — single row of compact KPIs with deltas.
23. **ComparisonTable** — N-column comparison matrix.
24. **TwoColumnCompare** — side-by-side narrative (Before vs After, Us vs Them).
25. **Roadmap** — horizontal swim-lane roadmap with quarters.
26. **GanttLite** — bars across a timeline (compact).
27. **CodeBlock** — syntax-highlighted code with line callouts.
28. **TerminalReplay** — typewriter terminal with multi-step reveals.
29. **MetricChart** — line/area/bar chart (data inline in JSON).
30. **DonutBreakdown** — donut chart + legend.
31. **CalloutCard** — large emphasized card (warning/info/success variants).
32. **CTA** — single big call-to-action with QR + URL.
33. **AgendaList** — numbered agenda with time markers.
34. **ChapterDivider** — section break with big numeral + label (variant of existing).
35. **EndCard** — thank-you card with contact handles.

## Cross-cutting requirements
- Every type renders a Ubuntu-Bold title (command 05).
- Every type provides a `step` mode where applicable (focus reveals).
- Every type is documented in the LLM guideline with: shape, example, do/don't.
- Every media field accepts either a `url`, a `base64` payload, or an
  `inlineSvg` string (parity with existing image rules).
