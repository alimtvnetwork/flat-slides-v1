import { DeckSettingsSchema } from "@/lib/slides/schema";

import type { DeckSettings } from "./types";

export const SETTINGS_STORAGE_KEY = "riseup.settings.v2";

export const DEFAULT_DECK_SETTINGS: DeckSettings = {
  backgroundMode: "color",
  backgroundColor: "#101010",
  darken: 0,
  blur: 0,
  transition: "fade",
  soundEnabled: true,
  volume: 0.6,
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

export function persistDeckSettings(settings: DeckSettings): void {
  const parsed = DeckSettingsSchema.safeParse(settings);
  if (!parsed.success) return;
  writeSettingsStorage(JSON.stringify({ version: 2, settings: parsed.data }));
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
  return window.localStorage.getItem(SETTINGS_STORAGE_KEY);
}

function writeSettingsStorage(value: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SETTINGS_STORAGE_KEY, value);
}