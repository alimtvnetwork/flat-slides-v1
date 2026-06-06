import { expect, test } from "@playwright/test";

const launcherLinks = [
  ["Inspector", "/slides/inspector/1"],
  ["Handout", "/slides/handout"],
  ["3-up", "/slides/handout-3up"],
  ["Print", "/slides/print"],
  ["Overview", "/slides"],
] as const;

test("home redirects to slides launcher with expected cases", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/slides\/1$/);
  await expect(page.getByRole("toolbar", { name: "Slides launcher" })).toBeVisible();
  for (const label of ["Present", "Import", "Export", "Settings"]) {
    await expect(page.getByRole("button", { name: label, exact: true })).toBeVisible();
  }
  for (const [label, href] of launcherLinks) {
    await expect(page.getByRole("link", { name: label, exact: true })).toHaveAttribute("href", href);
  }
});

test("settings launcher click is buffered and visible in the dev drawer", async ({ page }) => {
  await page.goto("/slides/1");

  await page.getByRole("button", { name: "Settings", exact: true }).click();

  await expect(page.getByText("slides:event buffer")).toBeVisible();
  await expect.poll(() => launcherCases(page)).toContain("settings");
});

async function launcherCases(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    type EventBufferWindow = Window & { __slidesEvents?: Array<{ type: string; case?: string }> };
    return ((window as EventBufferWindow).__slidesEvents ?? [])
      .filter((event) => event.type === "home-launcher-click")
      .map((event) => event.case ?? "");
  });
}