#!/usr/bin/env bun
/**
 * CLI deck linter — usage:
 *   bun scripts/lint-deck.ts <deck.json>          # human-readable
 *   bun scripts/lint-deck.ts <deck.json> --json   # machine-readable JSON
 *
 * Exits 1 if any errors found, 0 otherwise (warnings don't fail).
 */
import { readFileSync } from "node:fs";

import { countIssues, lintDeck } from "../src/components/slides/lint";
import type { Deck } from "../src/components/slides/types";

const args = process.argv.slice(2);
const json = args.includes("--json");
const path = args.find((a) => !a.startsWith("--"));
if (!path) {
  console.error("Usage: bun scripts/lint-deck.ts <deck.json> [--json]");
  process.exit(2);
}

const deck = JSON.parse(readFileSync(path, "utf8")) as Deck;
const issues = lintDeck(deck);
const counts = countIssues(issues);

if (json) {
  console.log(JSON.stringify({ path, deckId: deck.id, slideCount: deck.slides.length, counts, issues }, null, 2));
} else {
  for (const i of issues) {
    const tag = i.severity === "error" ? "ERR " : "WARN";
    console.log(`${tag}  #${i.slideIndex + 1} [${i.rule}] ${i.message}`);
  }
  console.log(`\n${counts.errors} error(s), ${counts.warns} warning(s) across ${deck.slides.length} slides.`);
}
process.exit(counts.errors > 0 ? 1 : 0);
