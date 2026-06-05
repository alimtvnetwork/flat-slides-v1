/**
 * Pure helpers for the ControllerPill so they can be unit-tested without
 * mounting React or touching `window`. Keep this file dependency-free.
 */

export type ControllerAnchor =
  | "bottom-center"
  | "bottom-right"
  | "bottom-left"
  | "top-right";

export const DEFAULT_CONTROLLER_ANCHOR: ControllerAnchor = "bottom-center";

export const CONTROLLER_ANCHOR_SHORTCUT_KEY = "b";

export const CONTROLLER_ANCHOR_ORDER: ControllerAnchor[] = [
  "bottom-center", "bottom-right", "bottom-left", "top-right",
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
