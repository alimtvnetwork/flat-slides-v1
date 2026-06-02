# Decision: Settings Background-Color Override

In `RenderSlide.tsx` `ThemeWrap`, when `settings.backgroundMode === "color"`
and the slide has no per-slide `background`, override `--slide-bg` CSS var
inline so the Settings → background color picker takes effect immediately.
