#!/usr/bin/env bun
/**
 * CLI deck linter — usage: bun scripts/lint-deck.ts <deck.json>
 * Exits with code 1 if any errors found, 0 otherwise (warns don't fail).
 */
import { readFileSync } from "node:fs";

import { countIssues, lintDeck } from "../src/components/slides/lint";
import type { Deck } from "../src/components/slides/types";

const path = process.argv[2];
if (!path) {
  console.error("Usage: bun scripts/lint-deck.ts <deck.json>");
  process.exit(2);
}

const deck = JSON.parse(readFileSync(path, "utf8")) as Deck;
const issues = lintDeck(deck);
const { errors, warns } = countIssues(issues);

for (const i of issues) {
  const tag = i.severity === "error" ? "ERR " : "WARN";
  console.log(`${tag}  #${i.slideIndex + 1} [${i.rule}] ${i.message}`);
}
console.log(`\n${errors} error(s), ${warns} warning(s) across ${deck.slides.length} slides.`);
process.exit(errors > 0 ? 1 : 0);
