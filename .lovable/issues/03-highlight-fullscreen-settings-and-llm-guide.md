# Issue 03: Yellow highlighter missing, fullscreen not real fullscreen, settings missing text/highlight colors, no downloadable LLM guide

**Status:** open
**Created:** 2026-06-06
**Reporter:** user (voice note, 30-step planning turn)

## Symptoms (verbatim from user)

1. "There is no yellow highlighter, which I cannot find. Try to have that yellow highlighter for keywords."
2. "The full screen button does not make it full screen, but it just covers in." (Fullscreen button only expands within the preview container instead of entering the browser Fullscreen API.)
3. "Text color and highlighter color you can keep in the settings, which you have not." (Settings panel is missing controls for slide text color and highlight color.)
4. "Add a menu section for a guide" with "download all as zip — LLM guide / theme guide" — user wants to download the JSON / theme / slide / LLM authoring guides as a single zip so they can feed it to another LLM.

User confirmed background color + theme switching is now working — that part is NOT a regression.

## Expected vs Actual

| Area | Expected | Actual |
| --- | --- | --- |
| Highlight | Keywords wrapped in `.hl` render with yellow/gold highlight + crisp text-shadow | No visible yellow highlight on slides |
| Fullscreen button | Enters browser Fullscreen API on the slide deck root | Only expands inside the preview iframe / container |
| Settings | Text color + highlight color pickers present alongside background color | Only background color present |
| LLM guide | Settings → Guide submenu with "Download LLM guide (zip)", "Download theme guide", "Download slide JSON guide" | No such menu |

## Repro

1. Open `/slides/1` in preview.
2. Inspect a slide that should have highlighted keywords — no yellow highlight visible.
3. Click the fullscreen control in the controller pill — preview only expands within the embedded frame, never goes true fullscreen.
4. Open Settings — no text-color or highlight-color pickers.
5. Open Settings — no "Guide" / download section.

## Related files (likely)

- `src/styles.css` — `.hl` rule, highlight token.
- `src/components/slides/RichText.tsx` (or equivalent) — `.hl` emission path.
- `src/components/slides/SlidePresenterPage.tsx` + `presenterActions.ts` — fullscreen action.
- Settings drawer component.
- `docs/slides/spec/llm-json-guideline.md`, `docs/slides/spec/sample-deck.json`, theme spec files — source material for the downloadable zip.

## User instruction (also captured as command 04)

> "Write the root cause analysis into the memory and why it happened, how it happened, into the issues as well, so that I could share with any other AI in the future so that they do not make this mistake."

RCA must be written to `.lovable/memory/diagnostics/` AND appended to this issue file once the fix lands.
