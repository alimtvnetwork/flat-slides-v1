/**
 * Custom (user-imported) themes — persisted to localStorage and merged
 * with the built-in THEMES list. Exposes import/export helpers used by
 * the Theme section in SettingsDrawer.
 *
 * Schema: see docs/slides/spec/theme-json-guideline.md
 */
import { z } from "zod";

import { _registerCustomThemesResolver, type Theme } from "./themes";

export const CUSTOM_THEMES_KEY = "riseup.themes.custom";

const HexColor = z
  .string()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/, "Expected #rgb / #rrggbb / #rrggbbaa");

export const ThemeSchema = z.object({
  id: z.string().min(1).max(64).regex(/^[a-z0-9-]+$/i, "id: a-z, 0-9, hyphen only"),
  name: z.string().min(1).max(80),
  bg: HexColor,
  fg: HexColor,
  muted: HexColor,
  hl: HexColor,
  hlInk: HexColor,
  fontHeading: z.string().min(1).max(200).optional(),
  fontBody: z.string().min(1).max(200).optional(),
  fontDisplay: z.string().min(1).max(200).optional(),
});

const DEFAULT_FONTS = {
  fontHeading: '"Ubuntu", system-ui, sans-serif',
  fontBody: '"Poppins", system-ui, sans-serif',
  fontDisplay: '"Instrument Serif", "Ubuntu", serif',
};

/** Accepts a single theme object or `{ themes: [...] }`. */
export const ThemePayloadSchema = z.union([
  ThemeSchema,
  z.object({ themes: z.array(ThemeSchema).min(1).max(50) }),
]);

export function loadCustomThemes(): Theme[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(CUSTOM_THEMES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    const arr = z.array(ThemeSchema).safeParse(parsed);
    if (!arr.success) return [];
    return arr.data.map((t) => ({ ...DEFAULT_FONTS, ...t }) as Theme);
  } catch {
    return [];
  }
}

export function saveCustomThemes(themes: Theme[]): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(themes));
  // Notify listeners (Theme section re-reads on this event).
  window.dispatchEvent(new CustomEvent("riseup:custom-themes-changed"));
}

export function upsertCustomThemes(incoming: Theme[]): Theme[] {
  const existing = loadCustomThemes();
  const byId = new Map(existing.map((t) => [t.id, t]));
  for (const t of incoming) byId.set(t.id, { ...DEFAULT_FONTS, ...t });
  const merged = Array.from(byId.values());
  saveCustomThemes(merged);
  return merged;
}

export function removeCustomTheme(id: string): Theme[] {
  const next = loadCustomThemes().filter((t) => t.id !== id);
  saveCustomThemes(next);
  return next;
}

/** Parse raw JSON text into a list of themes; throws with a friendly message. */
export function parseThemesJson(raw: string): Theme[] {
  const json = JSON.parse(raw);
  const result = ThemePayloadSchema.safeParse(json);
  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "Invalid theme JSON");
  }
  const list = "themes" in result.data ? result.data.themes : [result.data];
  return list.map((t) => ({ ...DEFAULT_FONTS, ...t }) as Theme);
}

/** Trigger a browser download of one or many themes. */
export function downloadThemesJson(themes: Theme[], filename = "themes.json"): void {
  const payload = themes.length === 1 ? themes[0] : { themes };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Open a file picker, return parsed themes. */
export async function pickThemesFile(): Promise<Theme[]> {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return reject(new Error("No file selected"));
      try {
        const text = await file.text();
        resolve(parseThemesJson(text));
      } catch (err) {
        reject(err);
      }
    };
    input.click();
  });
}
