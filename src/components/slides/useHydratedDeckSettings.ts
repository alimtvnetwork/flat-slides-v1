import { useEffect, useState } from "react";

import { useDeck } from "@/components/slides/store";
import { DEFAULT_DECK_SETTINGS } from "@/components/slides/settingsPersistence";
import type { DeckSettings } from "@/components/slides/types";

/**
 * Returns `deck.settings`, but only after client hydration. During SSR and
 * the first client render we return the shipped defaults so the markup
 * matches the server. On the next render (post-`useEffect`) we return the
 * real, possibly user-persisted settings.
 *
 * This avoids React hydration mismatches that otherwise prevent style
 * patches (background color, theme tokens, etc.) from ever reaching the
 * DOM when the user has customized settings via localStorage.
 */
export function useHydratedDeckSettings(): DeckSettings {
  const settings = useDeck((s) => s.deck.settings);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated ? settings : DEFAULT_DECK_SETTINGS;
}
