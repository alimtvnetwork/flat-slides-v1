import { useEffect } from "react";

/**
 * Returns true if a keyboard event originated from an editable surface
 * (input, textarea, select, contentEditable). All slide-engine keyboard
 * handlers must call this before reacting.
 */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return false;
}

export type ShortcutHandler = (event: KeyboardEvent) => void;

/**
 * Bind a window-level `keydown` handler that:
 *  - skips events from editable surfaces
 *  - skips events with modifier keys (meta/ctrl/alt) unless `passthroughModifiers`
 *    is set — so Cmd/Ctrl-K still reaches Command Palette
 */
export function useKeyboardShortcuts(
  handler: ShortcutHandler,
  options: { passthroughModifiers?: boolean; enabled?: boolean } = {},
) {
  const { passthroughModifiers = false, enabled = true } = options;
  useEffect(() => {
    if (!enabled) return;
    const onKey = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return;
      if (!passthroughModifiers && (event.metaKey || event.ctrlKey || event.altKey)) return;
      handler(event);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handler, passthroughModifiers, enabled]);
}
