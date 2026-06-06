# RCA: Fullscreen button only covers the preview iframe, never enters real fullscreen

## What was wrong

Clicking the fullscreen control inside the Lovable preview iframe expanded the deck only within the embedded frame instead of entering the browser Fullscreen API. The user reported "the full screen button does not make it full screen, but it just covers in."

## Root cause (one sentence)

`useFullscreen` requested `element.requestFullscreen()` on the slide root, but the parent preview iframe is not served with `allow="fullscreen"` (and even when it is, calling Fullscreen API from inside a non-top frame is restricted) — so the request silently resolves to a CSS-cover fallback inside the iframe rather than entering a top-level fullscreen window.

## Files implicated

- `src/components/slides/useFullscreen.ts` — fullscreen target/resolution logic.
- `src/components/slides/fullscreenTarget.test.ts` — encodes the preview-safe contract.
- `src/components/slides/SlidePresenterPage.tsx` — controller visibility while presenting.
- `spec/issues/014-preview-fullscreen-breaks-out-of-iframe.md` — issue spec.

## Fix contract

When running inside an embedded preview (`window.top !== window.self`), do not call `requestFullscreen()` on the iframe element. Instead, open the presenter route in a new top-level window (`window.open('/slides/inspector/...', '_blank', 'noopener')`) where Fullscreen API works against the document root. On the direct slide route (top-level), call `requestFullscreen()` on the deck root.

Controller pill MUST stay mounted in fullscreen so the user can exit — `SlidePresenterPage` no longer gates `<ControllerPill />` on `!isFs`.

## How verified

- `fullscreenTarget.test.ts` asserts the embedded-vs-top-level branching.
- Manual preview check: clicking fullscreen from the embedded preview opens a presenter window that responds to `F`/`Esc` correctly; the controller pill remains visible while fullscreen is active.

## Do not regress

- Do not call `requestFullscreen()` on any element when `window.top !== window.self`.
- Do not gate the controller pill on `!isFs` — that strips the visible exit affordance.
- Do not assume Fullscreen API works inside the Lovable preview iframe; treat it as always-denied and prefer the popup presenter path.
