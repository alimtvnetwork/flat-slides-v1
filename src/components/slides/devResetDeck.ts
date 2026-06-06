import { useAnnotations } from "./annotations-store";
import { useChrome } from "./chrome-store";
import { useDeck } from "./store";

/**
 * Issue 018 — dev-only escape hatch. When HMR leaves a stale persisted
 * deck in localStorage that no longer matches the source-of-truth slide
 * code, this clears the persisted snapshot and resets every store the
 * deck touches. Intended to be wired behind `import.meta.env.DEV`.
 *
 * Returns nothing; failure paths log and re-throw so the caller can
 * surface a toast.
 */
export async function devResetCachedDeck(): Promise<void> {
  try {
    await useDeck.persist.clearStorage();
  } catch (err) {
    console.error("[devResetCachedDeck] clearStorage failed", err);
    throw err;
  }
  useDeck.getState().resetDeck();
  useAnnotations.getState().clearAll();
  // Drop chrome overlays so the reset feels clean (camera bubble, focus editor).
  try {
    const chrome = useChrome.getState();
    if (chrome.focusEditorOpen) chrome.toggleFocusEditor();
  } catch (err) {
    console.warn("[devResetCachedDeck] chrome reset partial", err);
  }
}
