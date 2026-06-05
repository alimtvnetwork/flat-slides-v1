import { useEffect } from "react";

const IDLE_MS = 2500;
const ATTR = "data-cursor-hidden";

/**
 * Auto-hides the cursor on the given element after IDLE_MS of pointer inactivity.
 * Only active when `enabled` is true (typically: fullscreen presenter mode).
 * Reveals on pointermove, key navigation, or when disabled.
 */
export function useCursorAutoHide(
  getElement: () => HTMLElement | null,
  enabled: boolean,
): void {
  useEffect(() => {
    const el = getElement();
    if (!el) return;
    if (!enabled) {
      el.removeAttribute(ATTR);
      return;
    }
    let timer: ReturnType<typeof setTimeout> | null = null;
    const hide = () => el.setAttribute(ATTR, "true");
    const show = () => {
      el.removeAttribute(ATTR);
      if (timer) clearTimeout(timer);
      timer = setTimeout(hide, IDLE_MS);
    };
    show();
    window.addEventListener("pointermove", show, { passive: true });
    window.addEventListener("pointerdown", show, { passive: true });
    window.addEventListener("keydown", show, true);
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("pointermove", show);
      window.removeEventListener("pointerdown", show);
      window.removeEventListener("keydown", show, true);
      el.removeAttribute(ATTR);
    };
  }, [getElement, enabled]);
}

export const CURSOR_HIDDEN_ATTR = ATTR;
export const CURSOR_IDLE_MS = IDLE_MS;
