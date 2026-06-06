# SS-02 — Move white-balance slider into the controller

**Parent:** 05-controller-whitebal-fonts
**Slug:** whitebal-in-controller
**Status:** pending
**Created:** 2026-06-06

## Goal
Expose the white-balance / brightness slider from `ControllerPill` (top-right) via a popover button, removing the floating slider currently rendered separately.

## Implementation
1. Locate the current white-balance slider component and its store (likely `useWhiteBalance` or similar in `src/components/slides/`).
2. Add a `WhiteBalanceButton` inside `ControllerPill.tsx` between existing actions; click opens a `Popover` (shadcn) anchored below the button containing the slider + reset.
3. Remove the standalone floating slider mount in `SlidePresenterPage.tsx`.
4. Register the action in `presenterActions.ts` so the keyboard shortcut (if any) still works; keep parity test green.

## Verification
- Standalone slider no longer visible.
- Clicking the new button in the controller opens a popover with a working slider; value persists (localStorage key unchanged).
- Keyboard shortcut (if existed) still toggles the popover or applies the value.
