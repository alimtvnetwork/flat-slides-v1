/**
 * Pure helpers for the ControllerPill so they can be unit-tested without
 * mounting React or touching `window`. Keep this file dependency-free.
 */

export type ControllerAnchor =
  | "top-left" | "top-center" | "top-right"
  | "middle-left" | "middle-right"
  | "bottom-left" | "bottom-center" | "bottom-right";

export const CONTROLLER_ANCHOR_ORDER: ControllerAnchor[] = [
  "bottom-right", "bottom-center", "bottom-left",
  "middle-left", "top-left", "top-center", "top-right", "middle-right",
];

/** Next anchor in the right-click cycle. */
export function nextControllerAnchor(a: ControllerAnchor): ControllerAnchor {
  const i = CONTROLLER_ANCHOR_ORDER.indexOf(a);
  return CONTROLLER_ANCHOR_ORDER[(i + 1) % CONTROLLER_ANCHOR_ORDER.length];
}

/** Fixed-position CSS for the pill at a given anchor. */
export function anchorStyles(a: ControllerAnchor): React.CSSProperties {
  const inset = "max(env(safe-area-inset-bottom, 0px), 16px)";
  const sideInset = "max(env(safe-area-inset-right, 0px), 16px)";
  switch (a) {
    case "top-left":      return { top: inset, left: sideInset };
    case "top-center":    return { top: inset, left: "50%", transform: "translateX(-50%)" };
    case "top-right":     return { top: inset, right: sideInset };
    case "middle-left":   return { top: "50%", left: sideInset, transform: "translateY(-50%)" };
    case "middle-right":  return { top: "50%", right: sideInset, transform: "translateY(-50%)" };
    case "bottom-left":   return { bottom: inset, left: sideInset };
    case "bottom-center": return { bottom: inset, left: "50%", transform: "translateX(-50%)" };
    case "bottom-right":
    default:              return { bottom: inset, right: sideInset };
  }
}
