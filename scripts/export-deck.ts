#!/usr/bin/env bun
/**
 * Deck export-zip CLI — usage:
 *   bun scripts/export-deck.ts <deck.json> [-o out.zip] [--public public]
 *
 * Bundles the deck JSON plus every referenced local asset (images, sounds,
 * music) into a portable .zip so the deck can be handed off without the rest
 * of the repo.
 *
 * Asset URLs that match these patterns are followed:
 *   - "/foo.ext"        → resolved against --public (default: "public")
 *   - "./" / "../"      → resolved against the deck file's directory
 * Remote (https://) and inline (data:) assets are recorded as-is and not copied.
 *
 * Exits 0 on success, 1 if any referenced local asset is missing.
 */
import {
  readFileSync, existsSync, statSync, mkdtempSync, writeFileSync,
  cpSync, rmSync, mkdirSync,
} from "node:fs";
import { dirname, join, basename, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";

import type { Deck, Slide } from "../src/components/slides/types";

const args = process.argv.slice(2);
const positional = args.filter((a) => !a.startsWith("-"));
const deckPath = positional[0];
if (!deckPath) {
  console.error("Usage: bun scripts/export-deck.ts <deck.json> [-o out.zip] [--public public]");
  process.exit(2);
}
const outIdx = args.indexOf("-o");
const out = outIdx >= 0 ? args[outIdx + 1] : deckPath.replace(/\.json$/, "") + ".zip";
const pubIdx = args.indexOf("--public");
const publicDir = pubIdx >= 0 ? args[pubIdx + 1] : "public";

const deckDir = dirname(resolve(deckPath));
const deck = JSON.parse(readFileSync(deckPath, "utf8")) as Deck;

/** Collect every local asset URL referenced by the deck. */
function collectAssetUrls(d: Deck): string[] {
  const urls = new Set<string>();
  const add = (u?: string) => { if (typeof u === "string" && u.trim()) urls.add(u.trim()); };
  add(d.music?.url);
  for (const s of d.slides) {
    add(typeof s.background === "string" ? s.background : undefined);
    add(s.sound?.url);
    const sl = s as Slide & { src?: string; media?: { src?: string } };
    if (typeof sl.src === "string") add(sl.src);
    if (sl.media && typeof sl.media === "object" && "src" in sl.media) add(sl.media.src);
  }
  return [...urls];
}

/** Resolve a URL to a local filesystem path, or null if it's remote/inline. */
function resolveLocal(url: string): string | null {
  if (/^(https?:|data:)/i.test(url)) return null;
  if (url.startsWith("/")) return join(publicDir, url.slice(1));
  if (url.startsWith("./") || url.startsWith("../")) return join(deckDir, url);
  return null;
}

const referenced = collectAssetUrls(deck);
const localFiles: { url: string; src: string; zipPath: string }[] = [];
const missing: string[] = [];
for (const url of referenced) {
  const src = resolveLocal(url);
  if (!src) continue;
  if (!existsSync(src) || !statSync(src).isFile()) { missing.push(url); continue; }
  localFiles.push({ url, src, zipPath: `assets/${basename(src)}` });
}

if (missing.length) {
  console.error(`Missing ${missing.length} local asset(s):`);
  for (const m of missing) console.error("  -", m);
  process.exit(1);
}

// Bun's archive APIs vary across versions; shell out to `zip` for portability.
// `zip` is preinstalled on every supported CI runner.
const staging = mkdtempSync(join(tmpdir(), "deck-export-"));
try {
  writeFileSync(join(staging, "deck.json"), JSON.stringify(deck, null, 2));
  for (const f of localFiles) {
    const dst = join(staging, f.zipPath);
    mkdirSync(dirname(dst), { recursive: true });
    cpSync(f.src, dst);
  }
  const outAbs = resolve(out);
  const res = spawnSync("zip", ["-r", outAbs, "."], { cwd: staging, stdio: "inherit" });
  if (res.status !== 0) {
    console.error("zip command failed (is `zip` installed?)");
    process.exit(1);
  }
  console.log(`✓ Exported ${localFiles.length} asset(s) → ${relative(process.cwd(), outAbs)}`);
} finally {
  rmSync(staging, { recursive: true, force: true });
}
