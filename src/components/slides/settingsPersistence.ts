import { toast } from "sonner";

import { DeckSettingsSchema } from "@/lib/slides/schema";
import { DEFAULT_MUSIC_VOLUME } from "@/lib/slides/musicVolume";

import type { DeckSettings } from "./types";

// v3: reset persisted settings so any prior custom textColor (e.g. cream tint)
// is discarded and the slide foreground returns to pure theme white.
export const SETTINGS_STORAGE_KEY = "riseup.settings.v3";
const DECK_STORAGE_PREFIX = "riseup.deck.";

export const DEFAULT_DECK_SETTINGS: DeckSettings = {
  backgroundMode: "color",
  backgroundColor: "#101010",
  textColor: "#ffffff",
  darken: 0,
  blur: 0,
  transition: "fade",
  soundEnabled: true,
  volume: 0.6,
  musicVolume: DEFAULT_MUSIC_VOLUME,
};

type PersistedSettingsPayload = Partial<DeckSettings> & { settings?: DeckSettings; version?: number };

export function getDefaultDeckSettings(): DeckSettings {
  return { ...DEFAULT_DECK_SETTINGS };
}

export function readPersistedDeckSettings(fallback: DeckSettings = DEFAULT_DECK_SETTINGS): DeckSettings {
  const raw = readSettingsStorage();
  if (!raw) return { ...fallback };
  return parsePersistedDeckSettings(raw) ?? { ...fallback };
}

/** Returns true when the write succeeded, false on validation or quota failure. */
export function persistDeckSettings(settings: DeckSettings): boolean {
  const parsed = DeckSettingsSchema.safeParse(settings);
  if (!parsed.success) return false;
  return writeSettingsStorage(JSON.stringify({ version: 2, settings: parsed.data }));
}

export function resetPersistedDeckSettings(): DeckSettings {
  const settings = getDefaultDeckSettings();
  persistDeckSettings(settings);
  return settings;
}

export function parsePersistedDeckSettings(raw: string): DeckSettings | null {
  try {
    return parseSettingsPayload(JSON.parse(raw) as PersistedSettingsPayload);
  } catch (error) {
    console.warn("Unable to parse persisted slide settings", error);
    return null;
  }
}

function parseSettingsPayload(payload: PersistedSettingsPayload): DeckSettings | null {
  const candidate = payload.settings ?? payload;
  const parsed = DeckSettingsSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

function readSettingsStorage(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(SETTINGS_STORAGE_KEY);
  } catch (error) {
    console.warn("Unable to read persisted slide settings", error);
    return null;
  }
}

/** Issue 025: surface quota failures to the user instead of silently losing settings. */
function writeSettingsStorage(value: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, value);
    return true;
  } catch (error) {
    if (isQuotaError(error)) {
      console.warn("Storage quota exceeded while persisting slide settings", error);
      toast.error("Storage full — settings not saved.", {
        duration: 10000,
        action: {
          label: "Clear saved decks",
          onClick: () => {
            const removed = clearPersistedDecks();
            if (writeSettingsStorage(value)) {
              toast.success(`Cleared ${removed} saved deck${removed === 1 ? "" : "s"}; settings saved.`);
            }
          },
        },
      });
      return false;
    }
    console.warn("Unable to persist slide settings", error);
    return false;
  }
}

function isQuotaError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const name = error.name;
  const code = (error as DOMException).code;
  return name === "QuotaExceededError" || name === "NS_ERROR_DOM_QUOTA_REACHED" || code === 22;
}

/** Remove every `riseup.deck.*` entry from localStorage. Returns the count removed. */
export function clearPersistedDecks(): number {
  if (typeof window === "undefined") return 0;
  let removed = 0;
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(DECK_STORAGE_PREFIX)) keys.push(k);
    }
    for (const k of keys) {
      window.localStorage.removeItem(k);
      removed++;
    }
  } catch (error) {
    console.warn("Unable to clear persisted decks", error);
  }
  return removed;
}
