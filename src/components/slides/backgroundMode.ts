import type { DeckSettings } from "./types";

/**
 * Issue 026 — when the user switches to image background, bump `darken`
 * off zero so default `fg` colors stay readable over bright photos.
 *
 * Minimal helper, no canvas luminance yet (that's the optional
 * Auto-contrast follow-up in the issue's fix plan). Only mutates `darken`
 * when it's currently 0; respects any value the user has already chosen.
 */
export const IMAGE_BG_DEFAULT_DARKEN = 35;

export function nextBackgroundSettings(
  current: Pick<DeckSettings, "backgroundMode" | "darken">,
  mode: DeckSettings["backgroundMode"],
): Partial<DeckSettings> {
  if (mode !== "image") return { backgroundMode: mode };
  if (current.darken > 0) return { backgroundMode: mode };
  return { backgroundMode: mode, darken: IMAGE_BG_DEFAULT_DARKEN };
}
