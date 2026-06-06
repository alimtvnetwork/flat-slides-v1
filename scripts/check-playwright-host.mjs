import { chromium } from "@playwright/test";

const MISSING_LIB_RE = /error while loading shared libraries:\s*([^:]+):/;

function missingLibrary(message) {
  return MISSING_LIB_RE.exec(message)?.[1] ?? null;
}

function printHostDependencyError(error) {
  const message = error instanceof Error ? error.message : String(error);
  const library = missingLibrary(message);
  console.error("[e2e:preflight] Chromium failed to launch.");
  if (library) console.error(`[e2e:preflight] Missing host library: ${library}`);
  console.error("[e2e:preflight] Install Playwright browser dependencies, then rerun `bun run test:e2e`.");
  console.error("[e2e:preflight] In a normal Linux image: `bunx playwright install --with-deps chromium`.");
}

async function assertChromiumLaunches() {
  const browser = await chromium.launch();
  await browser.close();
}

try {
  await assertChromiumLaunches();
} catch (error) {
  printHostDependencyError(error);
  process.exit(1);
}