# Present / Fullscreen Spec

Owner: slides module. Source of truth for the "Present" (enter fullscreen) flow.

## Goals
1. Clicking **Present** from any slide route enters a true fullscreen view of the deck.
2. When the app is embedded inside the Lovable editor iframe (or any cross-origin iframe), native fullscreen is blocked by the browser. We MUST fall back to opening the slide URL in a top-level browser window/tab and prompt the presenter to confirm fullscreen there.
3. Escape never exits fullscreen silently — Escape is owned by the annotation tool. Exiting fullscreen requires the Minimize button or browser chrome.
4. All failure modes surface a visible toast — never a silent no-op.

## Surfaces
- `useFullscreen()` (`src/components/slides/useFullscreen.ts`) — single source of truth. Returns `{ isFs, enter, exit, toggle }`.
- `ControllerPill` Present button → `onToggleFullscreen` → `toggle()`.
- `enterFullscreen(target?, environment?)` — pure, environment-injected for tests.

## Decision table
| Context | Action | Result |
|---|---|---|
| `document.fullscreenElement` already set | no-op | `{ ok: true, mode: "already-fullscreen" }` |
| Embedded (`window.self !== window.top`) + popup allowed | open `?present=1` in top window | `{ ok: true, mode: "presenter-window" }` |
| Embedded + popup blocked | toast "Allow pop-ups…" | `{ ok: false, reason: "embedded-popup-blocked" }` |
| Top-level, fullscreen supported | `requestFullscreen(stableRoot)` + `keyboard.lock(["Escape"])` | `{ ok: true, mode: "native" }` |
| Top-level, `requestFullscreen` rejects | toast "Fullscreen blocked…" | `{ ok: false, reason: "native-failed", error }` |
| `fullscreenEnabled === false` | toast | `{ ok: false, reason: "unsupported" }` |

## Presenter-window handshake
- The embedded-fallback opens `${href}?present=1`.
- The top-level page sees `present=1` and shows a one-tap "Start presenting" overlay (gesture required by the Fullscreen API), then strips `present=1` from the URL once fullscreen succeeds.

## Escape contract
- Escape clears the active annotation tool. It does NOT exit fullscreen.
- Exit is via the Minimize button in `ControllerPill` (`toggle()` while `isFs` is true).

## Regression tests
- `src/components/slides/fullscreenTarget.test.ts` — unit coverage for stable root, embedded fallback, popup-blocked, and native-failed branches.
- `e2e/fullscreen-present.spec.ts` — Playwright: direct route enters native fullscreen; embedded iframe opens a top-level presenter window.

## Remaining work (post-spec)
Tracked in `.lovable/pending-issues/index.md`.
