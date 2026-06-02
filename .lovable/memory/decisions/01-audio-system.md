# Decision: Audio System

`src/components/slides/audio.ts` uses `HTMLAudioElement` with stop-before-play
(`el.pause(); el.currentTime = 0; el.play()`). Files live in `public/sounds/`.

Mapping:
- `whoosh` → `fade_swoosh_v4.mp3` (slide jumps)
- `zoom` → `zoom.mp3` (intra-slide step transitions, milestone clicks)
- `click` → `click.mp3` (generic UI)

`useSlideNavigation.ts` distinguishes slide jump (whoosh) vs step nav (zoom).
