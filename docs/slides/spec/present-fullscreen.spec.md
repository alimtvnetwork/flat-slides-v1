# Present / Fullscreen Spec

Owner: slides module. Source of truth for the "Present" (enter fullscreen) flow.

> **Updated 1.36.0** — embedded behavior inverted. F no longer auto-opens a
> top-level popup; embedded contexts stay in an in-iframe app-presentation
> surface. The popup path is now opt-in via `Shift+W` or the
> "Open in new window" item in the controller overflow menu.

## Goals
1. Clicking **Present** (or pressing `F`) from any slide route enters a fullscreen view of the deck.
2. When the app is embedded inside the Lovable editor iframe (or any cross-origin iframe), native fullscreen is blocked by the browser. We MUST stay inside the iframe (`mode: "app"`) and offer an explicit, user-initiated path to a top-level window — never auto-popup.
3. Escape never exits fullscreen silently — Escape is owned by the annotation tool. Exiting fullscreen requires the Minimize button or browser chrome.
4. All failure modes surface a visible toast — never a silent no-op.

## Surfaces
- `useFullscreen()` (`src/components/slides/useFullscreen.ts`) — single source of truth. Returns `{ isFs, enter, exit, toggle }`.
- `ControllerPill` Present button → `onToggleFullscreen` → `toggle()`.
- `ControllerOverflowMenu` "Open in new window" item → `openPresenterWindow()` directly. Mirrors the `Shift+W` keyboard path.
- `Shift+W` keyboard shortcut → `present-window` action in `presenterActions.ts:134` → `openPresenterWindow()`.
- `enterFullscreen(target?, environment?)` — pure, environment-injected for tests.

## Decision table
| Context | Action | Result |
|---|---|---|
| `document.fullscreenElement` already set | no-op | `{ ok: true, mode: "already-fullscreen" }` |
| Embedded (`window.self !== window.top`) | `setAppPresentationMode(true)` + set `data-slides-app-presenting` | `{ ok: true, mode: "app" }` |
| Top-level, fullscreen supported | `requestFullscreen(document.documentElement)` + `keyboard.lock(["Escape"])` | `{ ok: true, mode: "native" }` |
| Top-level, `requestFullscreen` rejects | toast "Fullscreen blocked…" | `{ ok: false, reason: "native-failed", error }` |
| `fullscreenEnabled === false` | toast | `{ ok: false, reason: "unsupported" }` |
| Explicit `Shift+W` / overflow item, popup opens | top-level window at `?present=1` | window handle returned |
| Explicit `Shift+W` / overflow item, popup blocked | toast "Allow pop-ups…" | `reportFullscreenFailure({ reason: "embedded-popup-blocked" })` |

## Invariants
- **No auto-popup on F.** The embedded branch in `useFullscreen.ts` MUST NOT call `window.open`. If `fullscreenTarget.test.ts:65–86` ever sees `window.open` invoked from embedded `enterFullscreen`, the build fails. This is the entire fix for issue 014.
- **Single popup path.** Keyboard (`Shift+W`) and mouse ("Open in new window") both call `openPresenterWindow()` and surface the same `reportFullscreenFailure({ reason: "embedded-popup-blocked" })` on block. No parallel implementations.
- **`data-slides-app-presenting` ownership.** Only `setAppPresentationMode` toggles this attribute. The CSS uses it to make the in-iframe presenter shell `fixed inset-0`.

## Presenter-window handshake
- `openPresenterWindow()` opens `${href}?present=1` as a top-level popup.
- The top-level page sees `present=1` and shows a one-tap "Start presenting" overlay (gesture required by the Fullscreen API), then strips `present=1` from the URL once fullscreen succeeds.
- If the popup is blocked, the app keeps the presenter on the current slide and shows a persistent fallback panel with the exact top-level presenter URL. The panel MUST provide both a normal click target and copy support because browsers may allow user-initiated links even when scripted popups are blocked.

## Presenter shell containment
- The browser native fullscreen target is `document.documentElement`, not a React route node. This avoids browser fullscreen exit if TanStack route params remount slide children during `/slides/N` → `/slides/N/S` navigation.
- The `/slides` layout owns the stable visual fullscreen shell (`data-slides-fullscreen-root`). It must be viewport-sized and clipped at all times, and while any ancestor is `:fullscreen` it must be `fixed inset-0` with `100vw × 100dvh` sizing.
- The slide route owns a single viewport-sized presenter shell (`data-slide-presenter-root`). It must be `fixed inset-0` in native fullscreen / app-presentation mode and `h-dvh` in normal route view.
- The stage, transition layer, and camera layer all clip to that shell (`overflow-hidden`, no min-content height expansion). The 1920×1080 canvas is scaled only inside `.slide-wrapper`; no parent transition may apply scale/zoom.
- The stable fullscreen target remains mounted across `/slides/N` and `/slides/N/S` navigation. Slide/step navigation and camera zoom must not remove, resize, or overflow the native fullscreen target; browser fullscreen must remain active until the presenter explicitly exits.

## Escape contract
- Escape clears the active annotation tool. It does NOT exit fullscreen.
- Exit is via the Minimize button in `ControllerPill` (`toggle()` while `isFs` is true).

## Regression tests
- `src/components/slides/fullscreenTarget.test.ts` — embedded branch never calls `window.open` / `requestFullscreen`; sets `data-slides-app-presenting`; top-level uses native FS.
- `src/components/slides/controls/ControllerOverflowMenu.test.tsx` — "Open in new window" item exists in overflow and calls `window.open` with `_blank` when selected.
- `src/components/slides/controls/PresenterFallbackLink.test.tsx` — popup-blocked fallback panel coverage.
- `src/components/slides/presenterShell.test.tsx` — shell/stage containment regression coverage.
- `src/routes/slides-layout.test.tsx` — route layout regression coverage for the stable clipped fullscreen target.
- `src/components/slides/presenterActions.test.ts` — keymap parity: `present-window` has an action and is bound to `Shift+W`.
- `e2e/fullscreen-present.spec.ts` — Playwright: direct route enters native fullscreen; embedded iframe stays in-iframe on F; explicit Shift+W / overflow opens a top-level presenter window.

## History
- **1.36.0** — Spec updated; "Open in new window" overflow item added.
- **1.35.0** — `Shift+W` keyboard shortcut wired to the popup path.
- **1.34.0** — Embedded auto-popup removed (closes spec issue 014). F stays in `mode: "app"`.

## Remaining work (post-spec)
Tracked in `.lovable/pending-issues/index.md`.
