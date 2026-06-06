import { toast } from "sonner";

import type { Deck, Slide } from "@/components/slides/types";

import { DeckSchema, SlideSchema } from "./schema";
import { DECK_SCHEMA_VERSION } from "./version";

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
  | { ok: false; error: string; errorFull: string; errorCount: number };

const MAX_TOAST_ISSUES = 4;

/** Issue 011: bail before Zod when the JSON payload is implausibly large. */
export const MAX_DECK_JSON_BYTES = 8_000_000;

function sizeFailure<T>(raw: string): ImportResult<T> {
  const mb = (raw.length / 1_000_000).toFixed(1);
  const msg = `Deck JSON is ${mb} MB (limit ${MAX_DECK_JSON_BYTES / 1_000_000} MB). Host large images on a CDN and use https:// URLs instead of base64.`;
  return { ok: false, error: msg, errorFull: msg, errorCount: 1 };
}

function jsonFailure<T>(e: unknown): ImportResult<T> {
  const msg = `Invalid JSON: ${(e as Error).message}`;
  return { ok: false, error: msg, errorFull: msg, errorCount: 1 };
}

function zodFailure<T>(err: import("zod").ZodError): ImportResult<T> {
  const lines = err.issues.map(
    (i) => `${i.path.join(".") || "(root)"}: ${i.message}`,
  );
  const short = lines.slice(0, MAX_TOAST_ISSUES).join("\n");
  const more = lines.length > MAX_TOAST_ISSUES ? `\n…and ${lines.length - MAX_TOAST_ISSUES} more` : "";
  return { ok: false, error: short + more, errorFull: lines.join("\n"), errorCount: lines.length };
}

export function parseDeckJson(raw: string): ImportResult<Deck> {
  if (raw.length > MAX_DECK_JSON_BYTES) return sizeFailure(raw);
  let json: unknown;
  try { json = JSON.parse(raw); } catch (e) { return jsonFailure(e); }
  const result = DeckSchema.safeParse(json);
  if (!result.success) return zodFailure(result.error);
  const deck = result.data as Deck;
  warnFocusRegionIssues(deck.slides);
  return { ok: true, value: deck };
}

export function parseSlideJson(raw: string): ImportResult<Slide> {
  if (raw.length > MAX_DECK_JSON_BYTES) return sizeFailure(raw);
  let json: unknown;
  try { json = JSON.parse(raw); } catch (e) { return jsonFailure(e); }
  const result = SlideSchema.safeParse(json);
  if (!result.success) return zodFailure(result.error);
  const slide = result.data as Slide;
  warnFocusRegionIssues([slide]);
  return { ok: true, value: slide };
}

/** Issue 024: log a single grouped warning instead of failing import. */
function warnFocusRegionIssues(slides: Slide[]) {
  const all: string[] = [];
  for (const s of slides) all.push(...validateFocusRegions(s));
  if (all.length === 0) return;
  console.warn(`[deck] ${all.length} focus-region issue(s):\n${all.join("\n")}`);
}



/** Trigger a mounted file input — returns the file's text contents. */
export function pickJsonFile(input?: HTMLInputElement | null, accept = ".json,application/json"): Promise<string | null> {
  return new Promise((resolve) => {
    const fileInput = input ?? document.createElement("input");
    const isTemporary = !input;
    fileInput.type = "file";
    fileInput.accept = accept;
    fileInput.value = "";
    if (isTemporary) document.body.appendChild(fileInput);
    fileInput.onchange = async () => {
      const f = fileInput.files?.[0];
      fileInput.onchange = null;
      if (isTemporary) fileInput.remove();
      if (!f) return resolve(null);
      // Reject non-JSON files early (issue 032) — the OS picker honors
      // `accept` loosely, so users can still pick `.txt`, images, etc.
      const looksJson =
        f.name.toLowerCase().endsWith(".json") ||
        f.type === "application/json" ||
        f.type === "" /* some OSes report empty mime for .json */;
      if (!looksJson) {
        toast.error(`Not a JSON file: ${f.name}`, {
          description: "Pick a `.deck.json` or `.slide.json` file exported from this app.",
        });
        return resolve(null);
      }
      if (f.size > 5 * 1024 * 1024) {
        toast.error("File too large (max 5 MB)");
        return resolve(null);
      }
      resolve(await f.text());
    };
    fileInput.click();
  });
}
