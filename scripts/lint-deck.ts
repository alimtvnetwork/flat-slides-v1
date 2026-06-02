#!/usr/bin/env bun
/**
 * CLI deck linter — usage:
 *   bun scripts/lint-deck.ts <deck.json> [more.json ...] [glob]
 *   bun scripts/lint-deck.ts 'slides/decks/*.json' --json
 *
 * - Accepts one or more file paths and/or glob patterns.
 * - `--json` prints a machine-readable result envelope.
 * - Exits 1 if any errors found across all decks, 0 otherwise.
 */
import { readFileSync } from "node:fs";
import { Glob } from "bun";

import { countIssues, lintDeck } from "../src/components/slides/lint";
import type { Deck } from "../src/components/slides/types";

const args = process.argv.slice(2);
const json = args.includes("--json");
const inputs = args.filter((a) => !a.startsWith("--"));
if (inputs.length === 0) {
  console.error("Usage: bun scripts/lint-deck.ts <deck.json|glob> [...] [--json]");
  process.exit(2);
}

// Expand any glob patterns.
const paths: string[] = [];
for (const input of inputs) {
  if (/[*?[]/.test(input)) {
    for (const m of new Glob(input).scanSync(".")) paths.push(m);
  } else {
    paths.push(input);
  }
}
if (paths.length === 0) {
  console.error("No files matched.");
  process.exit(2);
}

const results = paths.map((path) => {
  const deck = JSON.parse(readFileSync(path, "utf8")) as Deck;
  const issues = lintDeck(deck);
  return { path, deckId: deck.id, slideCount: deck.slides.length, counts: countIssues(issues), issues };
});

const totalErrors = results.reduce((n, r) => n + r.counts.errors, 0);
const totalWarns = results.reduce((n, r) => n + r.counts.warns, 0);

if (json) {
  console.log(JSON.stringify({ decks: results, totals: { errors: totalErrors, warns: totalWarns } }, null, 2));
} else {
  for (const r of results) {
    console.log(`\n— ${r.path}  (${r.counts.errors}E / ${r.counts.warns}W)`);
    for (const i of r.issues) {
      const tag = i.severity === "error" ? "ERR " : "WARN";
      console.log(`  ${tag}  #${i.slideIndex + 1} [${i.rule}] ${i.message}`);
    }
  }
  console.log(`\n${totalErrors} error(s), ${totalWarns} warning(s) across ${paths.length} deck(s).`);
}
process.exit(totalErrors > 0 ? 1 : 0);
