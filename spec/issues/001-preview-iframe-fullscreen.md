# 001 — Present-from-preview-iframe is silently unsupported (no popup fallback)

**Status:** open
**Spec:** `docs/slides/spec/present-fullscreen.spec.md`
**Code under suspicion:** `src/components/slides/useFullscreen.ts`,
`src/components/slides/controls/PresenterFallbackLink.tsx`,
`src/components/slides/SlidePresenterPage.tsx`, `src/routes/index.tsx`.

## Symptom

> "Slides keep breaking when I click Present from the in-app preview. From a
> different page (direct route in a top-level tab) it works."

User clicks **Present** while the app runs inside the Lovable preview iframe.
Native fullscreen never starts; no popup window opens; no visible toast or
fallback link appears. The deck appears to do nothing.

## Repro

1. Open the project preview (the app is mounted in an `<iframe sandbox>`).
2. Navigate to `/slides/1`.
3. Click the **Present** controller button (or press `F` / `P`).
4. Observed: nothing visibly happens.
5. Open the same `/slides/1` URL in a top-level browser tab → Present works.

## Investigation

`enterFullscreen()` in `src/components/slides/useFullscreen.ts` (lines 94–119):

```ts
if (document.fullscreenEnabled === false) return { ok: false, reason: "unsupported" };
...
try {
  await fullscreenTarget.requestFullscreen();
  ...
  return { ok: true, mode: "native" };
} catch (error) {
  const embedded = (environment.isEmbeddedWindow ?? isEmbeddedWindow)();
  if (embedded && environment.openPresenterWindow) {
    const opened = environment.openPresenterWindow();
    return opened ? { ok: true, mode: "presenter-window" } : { ok: false, reason: "embedded-popup-blocked" };
  }
  return { ok: false, reason: "native-failed", error };
}
```

`reportFullscreenFailure()` (lines ~132–142) only surfaces the persistent
"Open presenter window" fallback link when `reason === "embedded-popup-blocked"`.
For `"unsupported"` it flashes a toast and clears the fallback.

The Lovable preview iframe has no `allow="fullscreen"` permission. In Chrome
this makes `document.fullscreenEnabled === false`, so `enterFullscreen()`
returns `{ ok: false, reason: "unsupported" }` BEFORE the `try/catch`
ever runs — which means the embedded-window popup path is never attempted
and the persistent fallback link is never shown.

## Root cause

The `unsupported` guard at line 104 short-circuits before the embedded-window
fallback path can fire. The embedded-iframe case is conflated with the
"this browser has no fullscreen API at all" case, so the user gets a flash
toast and no recovery affordance.

Secondary issue: even when the popup-blocked path runs, the fallback link
mounts on `/` and `/slides/$slideId` but the button click handler does not
proactively show it for `unsupported` results from inside an iframe.

## Fix plan

1. In `enterFullscreen()`, BEFORE the `document.fullscreenEnabled === false`
   short-circuit, detect embedded iframe via `isEmbeddedWindow()`. If embedded:
   skip native fullscreen entirely and go straight to
   `environment.openPresenterWindow()`, returning either
   `{ ok: true, mode: "presenter-window" }` or
   `{ ok: false, reason: "embedded-popup-blocked" }`. Native fullscreen inside
   a Lovable preview iframe is never going to succeed; trying first only adds
   a console error.
2. Keep the existing `catch`-branch fallback for top-level windows whose
   `requestFullscreen()` throws unexpectedly (e.g. user-gesture lapse).
3. `reportFullscreenFailure()` already shows the persistent fallback link on
   `embedded-popup-blocked`. Verify it mounts on both `/` and
   `/slides/$slideId`/`/slides/$slideId/$step` (it does, per
   `src/routes/index.tsx:128` and `src/components/slides/SlidePresenterPage.tsx:400`).
4. No spec change needed — `present-fullscreen.spec.md` already documents
   "iframe → popup-window" as the prescribed path; we are bringing
   the code into spec compliance.

## Acceptance

- From the Lovable preview iframe, clicking **Present** opens a new top-level
  presenter window (or shows the "Open presenter window" fallback link with a
  copy-to-clipboard control when the popup is blocked).
- From a top-level tab, **Present** still enters native fullscreen as before
  (no regression on `home-present.test.ts`, `fullscreenTarget.test.ts`).
- `reduced-motion` users still get an instant transition.

## Regression test

Extend `src/components/slides/fullscreenTarget.test.ts`:

```ts
it("skips requestFullscreen entirely when embedded; uses openPresenterWindow", async () => {
  const openPresenterWindow = vi.fn(() => true);
  const requestFullscreen = vi.fn();
  // simulate Lovable preview iframe — fullscreenEnabled === false
  Object.defineProperty(document, "fullscreenEnabled", { configurable: true, value: false });

  const result = await enterFullscreen(document.body, {
    isEmbeddedWindow: () => true,
    openPresenterWindow,
  });

  expect(requestFullscreen).not.toHaveBeenCalled();
  expect(openPresenterWindow).toHaveBeenCalledTimes(1);
  expect(result).toEqual({ ok: true, mode: "presenter-window" });
});
```

## Status log

- 2026-06-06 — opened. RCA + fix plan ready for step 12 of `.lovable/plan.md`.

---

## Investigation log (step 5)

Traced on 2026-06-06. Files read:
- `src/components/slides/useFullscreen.ts` (lines 18–119)
- `src/components/slides/fullscreenTarget.ts`
- `src/components/slides/presenterWindowUrl.ts`
- `src/components/slides/PresenterFallbackLink.tsx` mount sites: `src/routes/index.tsx:128`, `src/components/slides/SlidePresenterPage.tsx:400`

Confirmed branches:
- `isEmbeddedWindow()` defined at `useFullscreen.ts:28` (compares `window.self !== window.top`).
- `openPresenterWindow()` defined at `useFullscreen.ts:46`, used only inside the `catch` block at line 113–115.
- Bug: `document.fullscreenEnabled === false` short-circuits at line 104 BEFORE the embedded fallback can run. In Lovable's preview iframe (no `allow="fullscreen"`), this returns `{ ok: false, reason: "unsupported" }` and the popup path is never attempted.

Fix target (Phase D, step 12): move an `isEmbeddedWindow()` check above the `unsupported` guard at line 104. If embedded, skip `requestFullscreen` entirely and call `environment.openPresenterWindow()` directly, returning `{ ok: true, mode: "presenter-window" }` or `{ ok: false, reason: "embedded-popup-blocked" }`. Keep the existing `catch` branch for top-level windows where `requestFullscreen` throws.

Status: investigation complete. Awaiting code fix in step 12.
