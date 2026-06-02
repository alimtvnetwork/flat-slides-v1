import { toast } from "sonner";

import type { Deck, Slide } from "@/components/slides/types";

import { DeckSchema, SlideSchema } from "./schema";

/** Current JSON schema version (bump on breaking change → write a migration). */
export const DECK_SCHEMA_VERSION = 1;

/* ────────────────────────── EXPORT ────────────────────────── */

function downloadBlob(filename: string, data: string, mime = "application/json") {
  const blob = new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Export the entire deck as a single `.deck.json`. */
export function exportDeck(deck: Deck): void {
  const payload = { ...deck, version: DECK_SCHEMA_VERSION };
  const safeName = (deck.title || deck.id).replace(/[^a-z0-9_-]+/gi, "_").toLowerCase();
  downloadBlob(`${safeName}.deck.json`, JSON.stringify(payload, null, 2));
}

/** Export ONE slide as a portable `.slide.json` (no deck settings). */
export function exportSlide(slide: Slide): void {
  const safeName = `${slide.id}.slide.json`;
  downloadBlob(safeName, JSON.stringify(slide, null, 2));
}

/* ────────────────────────── IMPORT ────────────────────────── */

export type ImportResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export function parseDeckJson(raw: string): ImportResult<Deck> {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (e) {
    return { ok: false, error: `Invalid JSON: ${(e as Error).message}` };
  }
  const result = DeckSchema.safeParse(json);
  if (!result.success) {
    return { ok: false, error: formatZodError(result.error) };
  }
  return { ok: true, value: result.data as Deck };
}

export function parseSlideJson(raw: string): ImportResult<Slide> {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (e) {
    return { ok: false, error: `Invalid JSON: ${(e as Error).message}` };
  }
  const result = SlideSchema.safeParse(json);
  if (!result.success) {
    return { ok: false, error: formatZodError(result.error) };
  }
  return { ok: true, value: result.data as Slide };
}

function formatZodError(err: import("zod").ZodError): string {
  return err.issues
    .slice(0, 4)
    .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("\n");
}

/** Trigger a hidden file input — returns the file's text contents. */
export function pickJsonFile(accept = ".json,application/json"): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.onchange = async () => {
      const f = input.files?.[0];
      if (!f) return resolve(null);
      if (f.size > 5 * 1024 * 1024) {
        toast.error("File too large (max 5 MB)");
        return resolve(null);
      }
      resolve(await f.text());
    };
    input.click();
  });
}
