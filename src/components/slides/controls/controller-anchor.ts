/**
 * Pure helpers for the ControllerPill so they can be unit-tested without
 * mounting React or touching `window`. Keep this file dependency-free.
 */

export type ControllerAnchor =
  | "bottom-center"
  | "bottom-right"
  | "bottom-left"
  | "top-right";

export const DEFAULT_CONTROLLER_ANCHOR: ControllerAnchor = "top-right";

export const CONTROLLER_ANCHOR_SHORTCUT_KEY = "b";

export const CONTROLLER_ANCHOR_ORDER: ControllerAnchor[] = [
  "top-right", "bottom-right", "bottom-center", "bottom-left",
];

/** Next anchor in the right-click cycle. */
export function nextControllerAnchor(a: ControllerAnchor): ControllerAnchor {
  const i = CONTROLLER_ANCHOR_ORDER.indexOf(a);
  return CONTROLLER_ANCHOR_ORDER[(i + 1) % CONTROLLER_ANCHOR_ORDER.length];
}

export function isControllerAnchorShortcut(event: KeyboardEvent): boolean {
  return event.key.toLowerCase() === CONTROLLER_ANCHOR_SHORTCUT_KEY;
}

/** Fixed-position CSS for the pill at a given anchor. */
export function anchorStyles(a: ControllerAnchor): React.CSSProperties {
  const inset = "max(env(safe-area-inset-bottom, 0px), 16px)";
  const sideInset = "max(env(safe-area-inset-right, 0px), 16px)";
  const bottom = `calc(var(--presenter-frame-bottom, 0px) + ${inset})`;
  const top = `calc(var(--presenter-frame-top, 0px) + ${inset})`;
  const right = `calc(var(--presenter-frame-right, 0px) + ${sideInset})`;
  const left = `calc(var(--presenter-frame-left, 0px) + ${sideInset})`;
  switch (a) {
    case "top-right":     return { top, right };
    case "bottom-left":   return { bottom, left };
    case "bottom-center": return { bottom, left: "50%", transform: "translateX(-50%)" };
    case "bottom-right":
    default:              return { bottom, right };
  }
}

/**
 * Issue 029: persisted anchors can survive a window resize into a
 * viewport where the pill (≈ 320–520 px wide) no longer fits at a corner.
 * `clampControllerAnchor` snaps to `bottom-center` in that case so the
 * pill remains reachable. Pure helper — no DOM reads, fully testable.
 *
 * `viewportWidth` is `window.innerWidth`; `pillWidth` is the measured
 * pill rect width; `sideInset` is the visual padding (matches the 16 px
 * in `anchorStyles`).
 */
export const CONTROLLER_PILL_MIN_SIDE_INSET = 16;
export function clampControllerAnchor(
  anchor: ControllerAnchor,
  viewportWidth: number,
  pillWidth: number,
  sideInset: number = CONTROLLER_PILL_MIN_SIDE_INSET,
): ControllerAnchor {
  if (anchor === "bottom-center") return anchor;
  const cornerFits = pillWidth + sideInset * 2 <= viewportWidth;
  return cornerFits ? anchor : "bottom-center";
}
